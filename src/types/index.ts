export interface BusStop {
  id: string;
  name: string;
  coordinates: [number, number];
  estimatedTime?: string;
  departureTime?: string;
  completed: boolean;
}

export interface Bus {
  id: string;
  name: string;
  origin: string;
  destination: string;
  currentLocation: [number, number];
  stops: BusStop[];
  status: 'active' | 'completed' | 'delayed';
  driver: string;
  capacity: number;
  occupancy: number;
  route: [number, number][];
  completedRouteIndex: number;
}

export interface PrivateService {
  id: string;
  name: string;
  type: 'taxi' | 'ride-share' | 'private-shuttle';
  currentLocation: [number, number];
  destination: [number, number];
  driver: string;
  status: 'active' | 'waiting' | 'completed';
}