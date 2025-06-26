import React, { createContext, useContext, useEffect, useState } from 'react';
import { GPSSocket, PingMessage } from '../services/gpsSocket';
import { Bus } from '../types';          // your existing interface

type BusMap = Record<string, Bus>;

const LiveBusContext = createContext<BusMap>({});

export const LiveBusProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Option A – start empty;  Option B – seed with mockBuses if you still want names/stops
  const [buses, setBuses] = useState<BusMap>({});

  useEffect(() => {
    const ws = new GPSSocket();

    ws.onPing((ping: PingMessage) => {
      setBuses(prev => {
        const existing = prev[ping.busId];

        // If we’ve never seen this bus before, make a skeleton record
        const base: Bus = existing ?? {
          id: ping.busId,
          name: `Bus ${ping.busId}`,
          origin: '-',
          destination: '-',
          driver: '-',
          capacity: 50,
          occupancy: 0,
          status: 'active',
          // whatever other fields your <Bus> type has
          currentLocation: [ping.lat, ping.lon],
          stops: [],
          route: [],
          completedRouteIndex: 0
        };

        return {
          ...prev,
          [ping.busId]: {
            ...base,
            currentLocation: [ping.lat, ping.lon],
            lastPing: ping.timestamp,
            status: 'active'
          }
        };
      });
    });

    return () => ws.close();
  }, []);

  return (
    <LiveBusContext.Provider value={buses}>
      {children}
    </LiveBusContext.Provider>
  );
};

export const useLiveBuses = () => useContext(LiveBusContext);
