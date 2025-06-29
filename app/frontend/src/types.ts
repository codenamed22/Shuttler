/* src/types.ts */

export interface BusStop {
  id: string;
  name: string;
  coordinates: [number, number];

  /** Has the stop been completed (bus passed)? */
  completed?: boolean;

  /** ETA text such as “3 min” or seconds; optional until prediction arrives */
  estimatedTime?: number | string;

  /** ISO string or epoch ms when bus departed; optional until arrival */
  departureTime?: number | string;
}

export interface Bus {
  id: string;
  name: string;
  origin: string;
  destination: string;
  driver: string;
  capacity: number;
  occupancy: number;
  status: 'active' | 'delayed' | 'completed';
  currentLocation: [number, number];
  route: [number, number][];
  stops: BusStop[];
  completedRouteIndex: number;
  lastPing?: number;
}
