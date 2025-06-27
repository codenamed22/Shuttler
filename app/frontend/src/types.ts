/* src/types.ts */

export interface BusStop {
  id: string;
  name: string;
  coordinates: [number, number];
  completed: boolean;

  /** ETA text such as “3 min” _or_ seconds; undefined until prediction arrives */
  estimatedTime?: string;          // ← optional

  /** ISO string or epoch ms when bus departed; undefined until arrival */
  departureTime?: string;          // ← optional
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
