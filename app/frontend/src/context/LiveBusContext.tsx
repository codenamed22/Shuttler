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

type BusMap = Record<string, Bus>;
const LiveBusContext = createContext<BusMap>({});

const MIN_MOVE_METERS = 15;

export const LiveBusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [buses, setBuses] = useState<BusMap>({});
  const downloadedRoutes = useRef<Set<string>>(new Set());

  /* ────────── GPS WebSocket ────────── */
  useEffect(() => {
    const gps = new GPSSocket();

    gps.onPing(async (ping: PingMessage) => {
      /* reject malformed lat/lon */
      if (!Number.isFinite(ping.lat) || !Number.isFinite(ping.lon)) return;

      /* live update */
      setBuses((prev) => {
        const existing = prev[ping.busId];

        /* ignore jitter <15 m */
        if (existing?.currentLocation) {
          const dist = getDistance(
            { latitude: existing.currentLocation[0], longitude: existing.currentLocation[1] },
            { latitude: ping.lat,              longitude: ping.lon }
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
          },
        };
      });

      /* lazy-load route once */
      if (downloadedRoutes.current.has(ping.busId)) return;
      downloadedRoutes.current.add(ping.busId);

      try {
        const file = BUS_ROUTE_MAP[ping.busId] ?? ping.busId;
        const res = await fetch(`http://localhost:8000/route_${file}.geojson`);
        if (!res.ok) return;

        const geo = await res.json();
        const coords = geo.features[0].geometry.coordinates;
        const route: [number, number][] = coords.map(
          ([lon, lat]: [number, number]) => [lat, lon]
        );

        const stopsRaw = geo.features[0].properties.stops as {
          stopId: string;
          name: string;
          lat: number;
          lon: number;
        }[];

        setBuses((prev) => {
          const stops: BusStop[] = stopsRaw.map((s) => ({
            id: s.stopId,
            name: s.name,
            coordinates: [s.lat, s.lon],
            completed: ping.arrivedStops?.includes(s.stopId) ?? false,
            estimatedTime: undefined,
            departureTime: undefined,
          }));

          return {
            ...prev,
            [ping.busId]: {
              ...prev[ping.busId],
              route,
              stops,
              origin: stops[0]?.name ?? "–",
              destination: stops.at(-1)?.name ?? "–",
            },
          };
        });
      } catch (err) {
        console.error("route load failed:", err);
      }
    });

    return () => gps.close();
  }, []);

  return (
    <LiveBusContext.Provider value={buses}>{children}</LiveBusContext.Provider>
  );
};

export const useLiveBuses = () => useContext(LiveBusContext);