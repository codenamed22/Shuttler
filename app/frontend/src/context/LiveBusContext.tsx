import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { GPSSocket, PingMessage } from "../services/gpsSocket";
import { Bus } from "../types";
import { BUS_ROUTE_MAP } from "../constants/routeMap";
import { getDistance } from "geolib";

// ---------------------------------------------------------------------------
// Context & Types ------------------------------------------------------------
// ---------------------------------------------------------------------------

type BusMap = Record<string, Bus>;
const LiveBusContext = createContext<BusMap>({});

// Ignore GPS hops < 15 m (safety net; coords are already Kalman‑smoothed)
const MIN_MOVE_METERS = 15;

// ---------------------------------------------------------------------------
// Provider -------------------------------------------------------------------
// ---------------------------------------------------------------------------

export const LiveBusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [buses, setBuses] = useState<BusMap>({});
  const downloadedRoutes = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ws = new GPSSocket();

    ws.onPing(async (ping: PingMessage) => {
      // 🔸 1.  Update live location & completed stops -----------------------
      setBuses((prev) => {
        const existing = prev[ping.busId];

        // distance gate — optional because backend coords are smooth
        if (existing) {
          const dist = getDistance(
            {
              latitude: existing.currentLocation[0],
              longitude: existing.currentLocation[1],
            },
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
            stops: [],
            route: [],
            completedRouteIndex: 0,
          };

        // mark stops completed using stopIndex
        const updatedStops =
        base.stops.map(st => ({
    ...st,
    completed: ping.arrivedStops?.includes(st.id) ?? false
  }));


        const next: Bus = {
          ...base,
          currentLocation: [ping.lat, ping.lon],
          lastPing: ping.timestamp,
          stops: updatedStops,
          status: "active",
        };

        return { ...prev, [ping.busId]: next };
      });

      // 🔸 2.  Lazy‑load route GeoJSON once per bus -------------------------
      if (downloadedRoutes.current.has(ping.busId)) return;
      downloadedRoutes.current.add(ping.busId);

      try {
        const routeFile = BUS_ROUTE_MAP[ping.busId] ?? ping.busId;
        const res = await fetch(
          `http://localhost:8000/route_${routeFile}.geojson`,
        );
        if (!res.ok) {
          console.error("404 route file", res.url);
          return;
        }

        const geo = await res.json();
        const feature = geo.features[0];

        const route: [number, number][] = feature.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon],
        );

        const stopsRaw = feature.properties.stops as {
          stopId: string;
          name: string;
          lat: number;
          lon: number;
        }[];

        setBuses((prev) => {
          const current = prev[ping.busId] as Bus | undefined;     // may be undefined on first route load

          const stops = stopsRaw.map((s) => ({
  id: s.stopId,
  name: s.name,
  coordinates: [s.lat, s.lon] as [number, number],
  completed: ping.arrivedStops?.includes(s.stopId) ?? false,  // ✅ preserve grey
  estimatedTime: "",
  departureTime: "",
}));



          const origin = stops[0]?.name ?? "–";
          const destination = stops.at(-1)?.name ?? "–";

          return {
            ...prev,
            ...prev,
            [ping.busId]: {
              ...prev[ping.busId],
              route,
              stops,
              origin,
              destination,
            },
          };
        });
      } catch (err) {
        console.error("Failed to fetch route file", err);
      }
    });

    return () => ws.close();
  }, []);

  return (
    <LiveBusContext.Provider value={buses}>{children}</LiveBusContext.Provider>
  );
};

export const useLiveBuses = () => useContext(LiveBusContext);
