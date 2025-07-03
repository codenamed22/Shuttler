/* ------------------------------------------------------------------
 * LiveBusContext
 *  – Maintains one in-memory map of every bus currently seen in
 *    WebSocket pings.
 *  – Enriches those raw pings with route + stop metadata loaded from
 *    GeoJSON, and with ETA data coming from a second /ws/eta feed.
 * ------------------------------------------------------------------ */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getDistance } from 'geolib';
import { gpsSocket, PingMessage } from '../services/gpsSocket';
import { Bus, BusStop } from '../types';
import { BUS_ROUTE_MAP } from '../constants/routeMap';
import type { PropsWithChildren } from 'react';

/* ---------- types ---------- */
type BusMap = Record<string, Bus>;

/* ---------- context ---------- */
const LiveBusContext = createContext<BusMap>({});
export const useLiveBuses = () => useContext(LiveBusContext);

/* ---------- constants ---------- */
const MIN_MOVE_METERS = 15;          // ignore jitter < 15 m
const ROUTE_BASE_URL = 'http://localhost:8000'; // geojson host

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */
export const LiveBusProvider: React.FC<PropsWithChildren> = ({ children }: PropsWithChildren<{}>,) => {
  const [buses, setBuses] = useState<BusMap>({});
  const loadedRoutes = useRef<Set<string>>(new Set());
  const etaSockets   = useRef<Record<string, WebSocket>>({});

  /* ────────── 1. GPS ping stream (port 8080 → see GPSSocket) ────────── */
  useEffect(() => {
    const gps = gpsSocket;

    gps.onPing((ping: PingMessage) => {
      if (!Number.isFinite(ping.lat) || !Number.isFinite(ping.lon)) return;

      setBuses((prev) => {
        const existing = prev[ping.busId];

        // Debounce tiny jumps so UI doesn’t thrash
        if (existing?.currentLocation) {
          const dist = getDistance(
            {
              latitude:  existing.currentLocation[0],
              longitude: existing.currentLocation[1],
            },
            { latitude: ping.lat!, longitude: ping.lon! },
          );
          if (dist < MIN_MOVE_METERS) return prev;
        }

        // Bootstrap skeleton if we’ve never seen this bus before
        const base: Bus =
          existing ?? {
            id: ping.busId,
            name: `Bus ${ping.busId}`,
            origin: '–',
            destination: '–',
            driver: '–',
            capacity: 50,
            occupancy: 0,
            status: 'active',
            currentLocation: [ping.lat!, ping.lon!],
            route: [],
            stops: [],
            completedRouteIndex: 0,
          };

        const updatedStops = base.stops.map((st) => ({
          ...st,
          completed: ping.arrivedStops?.includes(st.id) ?? st.completed,
        }));

        return {
          ...prev,
          [ping.busId]: {
            ...base,
            currentLocation: [ping.lat!, ping.lon!],
            lastPing: ping.timestamp,
            stops: updatedStops,
            completedRouteIndex:
              (ping as any).index ?? base.completedRouteIndex,
             occupancy: ping.occupancy ?? base.occupancy, 
          },
        };
      });
    });

    return () => gps.close();
  }, []);

  /* ────────── 2. Lazy-load GeoJSON route per bus (only once) ────────── */
  useEffect(() => {
    (async () => {
      for (const busId of Object.keys(buses)) {
        if (loadedRoutes.current.has(busId)) continue;
        loadedRoutes.current.add(busId);

        try {
          const file = BUS_ROUTE_MAP[busId] ?? busId;
          const res = await fetch(`${ROUTE_BASE_URL}/route_${file}.geojson`);
          if (!res.ok) continue;

          const geo     = await res.json();
          const coords  = geo.features[0].geometry.coordinates;
          const route   = coords.map(
            ([lon, lat]: [number, number]): [number, number] => [lat, lon],
          );

          const stopsRaw = geo.features[0].properties.stops as {
            stopId: string;
            name: string;
            lat: number;
            lon: number;
          }[];

          setBuses((prev) => ({
            ...prev,
            [busId]: {
              ...prev[busId],
              route,
              origin:       stopsRaw[0]?.name      ?? '–',
              destination:  stopsRaw.at(-1)?.name ?? '–',
              stops: stopsRaw.map(
                (s): BusStop => ({
                  id:   s.stopId,
                  name: s.name,
                  coordinates: [s.lat, s.lon],
                  completed:      false,
                  estimatedTime:  undefined,
                  departureTime:  undefined,
                }),
              ),
            },
          }));
        } catch (e) {
          console.error('route load failed', e);
        }
      }
    })();
  }, [buses]);

  /* ────────── 3. Per-bus ETA WebSockets (port 8080 /ws/eta) ────────── */
  useEffect(() => {
    Object.keys(buses).forEach((busId) => {
      // already have a socket?
      if (etaSockets.current[busId]) return;

      // wait until stops loaded, otherwise ETA frames can’t map stopId → row
      const bus = buses[busId];
      if (!bus || bus.stops.length === 0) return;

      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const ws    = new WebSocket(
        `${proto}://localhost:8080/ws/eta?busId=${busId}`,
      );
      etaSockets.current[busId] = ws;

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);

          /* arrivalTimes frame */
          if ('arrivedStops' in data) {
            const { arrivedStops, arrivalTimes } = data as {
              arrivedStops: string[];
              arrivalTimes: Record<string, number>;
            };

            setBuses((prev) => ({
              ...prev,
              [busId]: {
                ...prev[busId],
                stops: prev[busId].stops.map((st) =>
                  arrivedStops.includes(st.id)
                    ? {
                        ...st,
                        completed:     true,
                        departureTime: arrivalTimes[st.id],
                        estimatedTime: undefined,
                      }
                    : st,
                ),
              },
            }));
            return;
          }

          /* etaPerStop frame */
          if ('etaPerStop' in data) {
            const { etaPerStop } = data as {
              etaPerStop: Record<string, number>;
            };

            setBuses((prev) => ({
              ...prev,
              [busId]: {
                ...prev[busId],
                stops: prev[busId].stops.map((st) =>
                  etaPerStop[st.id]
                    ? { ...st, estimatedTime: etaPerStop[st.id] }
                    : st,
                ),
              },
            }));
          }
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onclose = () => {
        delete etaSockets.current[busId];
        /* Trigger effect re-run → open a new socket after 2 s */
        setTimeout(() => setBuses((b) => ({ ...b })), 2000);
      };
    });

    /* cleanup on unmount */
    return () => {
      Object.values(etaSockets.current).forEach((ws) => ws.close());
    };
  }, [buses]);

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <LiveBusContext.Provider value={buses}>
      {children}
    </LiveBusContext.Provider>
  );
};