import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { GPSSocket, PingMessage } from '../services/gpsSocket';
import { Bus } from '../types';
import { BUS_ROUTE_MAP } from '../constants/routeMap';

type BusMap = Record<string, Bus>;
const LiveBusContext = createContext<BusMap>({});

export const LiveBusProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [buses, setBuses] = useState<BusMap>({});
  const downloadedRoutes = useRef<Set<string>>(new Set()); // avoid double-fetch

  /* ───── WebSocket listener ───── */
  useEffect(() => {
    const ws = new GPSSocket();

    ws.onPing(async (ping: PingMessage) => {
      /*   always update live fields */
      setBuses(prev => {
        const existing = prev[ping.busId];

        const base: Bus = existing ?? {
          id: ping.busId,
          name: `Bus ${ping.busId}`,
          origin: '–',
          destination: '–',
          driver: '–',
          capacity: 50,
          occupancy: 0,
          status: 'active',
          currentLocation: [ping.lat, ping.lon],
          stops: [],
          route: [],
          completedRouteIndex: 0
        };

        const next: Bus = {
          ...base,
          currentLocation: [ping.lat, ping.lon],
          lastPing: ping.timestamp,
          completedRouteIndex: ping.index ?? base.completedRouteIndex,
          status: 'active'
        };

        return { ...prev, [ping.busId]: next };
      });

      /*   lazy-load the GeoJSON once per busId */
      const routeKey = ping.busId;
      if (downloadedRoutes.current.has(routeKey)) return;
      downloadedRoutes.current.add(routeKey);

      try {
        const routeFile = BUS_ROUTE_MAP[ping.busId] ?? ping.busId;   // fallback

        const res = await fetch(`http://localhost:8000/route_${routeFile}.geojson`);
        if (!res.ok) {
          console.error('404 route file', res.url);
          return;
        }

        const geo = await res.json();
        const feature = geo.features[0];

        /* coords [lon,lat] -> [lat,lon] */
        const route: [number, number][] = feature.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
        );

        /* stops */
        const stopsRaw = feature.properties.stops as {
          stopId: string;
          name: string;
          lat: number;
          lon: number;
        }[];

        const stops = stopsRaw.map(s => ({
          id: s.stopId,
          name: s.name,
          coordinates: [s.lat, s.lon] as [number, number],
          completed: false,
          estimatedTime: '',
          departureTime: ''
        }));

        const origin = stops[0]?.name ?? '–';
        const destination = stops.at(-1)?.name ?? '–';

        /* patch the bus with static data */
        setBuses(prev => ({
          ...prev,
          [ping.busId]: {
            ...prev[ping.busId],
            route,
            stops,
            origin,
            destination
          }
        }));
      } catch (err) {
        console.error('Failed to fetch route file', err);
      }
    });

    return () => ws.close();
  }, []);

  return (
    <LiveBusContext.Provider value={buses}>{children}</LiveBusContext.Provider>
  );
};

export const useLiveBuses = () => useContext(LiveBusContext);
