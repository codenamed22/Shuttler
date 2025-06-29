/* app/frontend/src/context/LiveBusContext.tsx */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { GPSSocket, PingMessage } from "../services/gpsSocket";
import { Bus, BusStop } from "../types";
import { BUS_ROUTE_MAP } from "../constants/routeMap";
import { getDistance } from "geolib";

/* ------------------------------------------------------------------ */
/* Context setup                                                      */
/* ------------------------------------------------------------------ */

type BusMap = Record<string, Bus>;
const LiveBusContext = createContext<BusMap>({});

const MIN_MOVE_METERS = 15; // ignore GPS jitter < 15 m

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

export const LiveBusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [buses, setBuses] = useState<BusMap>({});
  const loadedRoutes = useRef<Set<string>>(new Set()); // track which busIds have a route

  /* 1 ▪ GPS WebSocket (port 8765) ---------------------------------------- */
  useEffect(() => {
    const gps = new GPSSocket();

    gps.onPing((ping: PingMessage) => {
      if (!Number.isFinite(ping.lat) || !Number.isFinite(ping.lon)) return;

      setBuses((prev) => {
        const existing = prev[ping.busId];

        // distance gate
        if (existing?.currentLocation) {
          const dist = getDistance(
            { latitude: existing.currentLocation[0], longitude: existing.currentLocation[1] },
            { latitude: ping.lat, longitude: ping.lon },
          );
          if (dist < MIN_MOVE_METERS) return prev;
        }

        const base: Bus =
          existing ?? {
            id: ping.busId,
            name: `Bus ${ping.busId}`,
            origin: "–",
            destination: "–",
            driver: "–",
            capacity: 50,
            occupancy: 0,
            status: "active",
            currentLocation: [ping.lat, ping.lon],
            route: [],
            stops: [],
            completedRouteIndex: 0,
          };

        const updatedStops = base.stops.map((st) => ({
          ...st,
          completed: ping.arrivedStops?.includes(st.id) ?? false,
        }));

        return {
          ...prev,
          [ping.busId]: {
            ...base,
            currentLocation: [ping.lat, ping.lon],
            lastPing: ping.timestamp,
            stops: updatedStops,
            completedRouteIndex: (ping as any).index ?? base.completedRouteIndex,
          },
        };
      });
    });

    return () => gps.close();
  }, []);

  /* 2 ▪ Lazy-load route GeoJSON (once per bus) --------------------------- */
  useEffect(() => {
    (async () => {
      for (const busId of Object.keys(buses)) {
        if (loadedRoutes.current.has(busId)) continue;
        loadedRoutes.current.add(busId);

        try {
          const file = BUS_ROUTE_MAP[busId] ?? busId;
          const res = await fetch(`http://localhost:8000/route_${file}.geojson`);
          if (!res.ok) continue;

          const geo = await res.json();
          const coords = geo.features[0].geometry.coordinates;
          const route: [number, number][] = coords.map(
            ([lon, lat]: [number, number]) => [lat, lon],
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
              origin: stopsRaw[0]?.name ?? "–",
              destination: stopsRaw.at(-1)?.name ?? "–",
              stops: stopsRaw.map((s): BusStop => ({
                id: s.stopId,
                name: s.name,
                coordinates: [s.lat, s.lon],
                completed: false,
                estimatedTime: undefined,
                departureTime: undefined,
              })),
            },
          }));
        } catch (e) {
          console.error("route load failed", e);
        }
      }
    })();
  }, [buses]);

  /* 3 ▪ ETA WebSockets (port 8080) – one per bus ------------------------- */
  const etaSockets = useRef<Record<string, WebSocket>>({});

  useEffect(() => {
    Object.keys(buses).forEach((busId) => {
      if (etaSockets.current[busId]) return; // already open

      const bus = buses[busId];
      if (!bus || bus.stops.length === 0) return; // wait until stops loaded

      const proto = location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://localhost:8080/ws/eta?busId=${busId}`);
      etaSockets.current[busId] = ws;

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);

          if ("arrivedStops" in data) {
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
                        completed: true,
                        departureTime: arrivalTimes[st.id],
                        estimatedTime: undefined,
                      }
                    : st,
                ),
              },
            }));
            return;
          }

          if ("etaPerStop" in data) {
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
        setTimeout(() => {
          if (!etaSockets.current[busId]) {
            setBuses((b) => ({ ...b })); // trigger effect to retry
          }
        }, 2000);
      };
    });

    return () => {
      Object.values(etaSockets.current).forEach((ws) => ws.close());
    };
  }, [buses]);

  return (
    <LiveBusContext.Provider value={buses}>{children}</LiveBusContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export const useLiveBuses = () => useContext(LiveBusContext);
