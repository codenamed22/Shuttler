export interface BusStop {
  id: string;
  name: string;
  coordinates: [number, number];
  completed: boolean;
  estimatedTime: string;
  departureTime: string;
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
