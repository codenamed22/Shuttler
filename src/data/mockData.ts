import { Bus } from '../types';

export const mockBuses: Bus[] = [
  {
    id: 'bus-001',
    name: 'City Express A1',
    origin: 'Downtown Terminal',
    destination: 'Airport Terminal',
    currentLocation: [40.7128, -74.0060],
    status: 'active',
    driver: 'John Smith',
    capacity: 45,
    occupancy: 32,
    completedRouteIndex: 3,
    stops: [
      {
        id: 'stop-1',
        name: 'Downtown Terminal',
        coordinates: [40.7589, -73.9851],
        departureTime: '08:00 AM',
        completed: true
      },
      {
        id: 'stop-2',
        name: 'Central Park West',
        coordinates: [40.7614, -73.9776],
        departureTime: '08:15 AM',
        completed: true
      },
      {
        id: 'stop-3',
        name: 'Times Square Hub',
        coordinates: [40.7505, -73.9934],
        departureTime: '08:30 AM',
        completed: true
      },
      {
        id: 'stop-4',
        name: 'Penn Station',
        coordinates: [40.7505, -73.9934],
        estimatedTime: '08:45 AM',
        completed: false
      },
      {
        id: 'stop-5',
        name: 'LaGuardia Bridge',
        coordinates: [40.7282, -73.8448],
        estimatedTime: '09:15 AM',
        completed: false
      },
      {
        id: 'stop-6',
        name: 'Airport Terminal',
        coordinates: [40.6413, -73.7781],
        estimatedTime: '09:45 AM',
        completed: false
      }
    ],
    route: [
      [40.7589, -73.9851],
      [40.7614, -73.9776],
      [40.7505, -73.9934],
      [40.7505, -73.9934],
      [40.7282, -73.8448],
      [40.6413, -73.7781]
    ]
  },
  {
    id: 'bus-002',
    name: 'Metro Line B2',
    origin: 'University Campus',
    destination: 'Shopping District',
    currentLocation: [40.6892, -74.0445],
    status: 'active',
    driver: 'Maria Garcia',
    capacity: 40,
    occupancy: 28,
    completedRouteIndex: 2,
    stops: [
      {
        id: 'stop-7',
        name: 'University Campus',
        coordinates: [40.6892, -74.0445],
        departureTime: '09:00 AM',
        completed: true
      },
      {
        id: 'stop-8',
        name: 'Library Square',
        coordinates: [40.7282, -74.0776],
        departureTime: '09:20 AM',
        completed: true
      },
      {
        id: 'stop-9',
        name: 'City Hall',
        coordinates: [40.7128, -74.0060],
        estimatedTime: '09:40 AM',
        completed: false
      },
      {
        id: 'stop-10',
        name: 'Shopping District',
        coordinates: [40.7505, -73.9857],
        estimatedTime: '10:00 AM',
        completed: false
      }
    ],
    route: [
      [40.6892, -74.0445],
      [40.7282, -74.0776],
      [40.7128, -74.0060],
      [40.7505, -73.9857]
    ]
  },
  {
    id: 'bus-003',
    name: 'Express Route C3',
    origin: 'North Station',
    destination: 'South Terminal',
    currentLocation: [40.7831, -73.9712],
    status: 'delayed',
    driver: 'Robert Johnson',
    capacity: 50,
    occupancy: 15,
    completedRouteIndex: 1,
    stops: [
      {
        id: 'stop-11',
        name: 'North Station',
        coordinates: [40.7831, -73.9712],
        departureTime: '07:30 AM',
        completed: true
      },
      {
        id: 'stop-12',
        name: 'Medical Center',
        coordinates: [40.7614, -73.9776],
        estimatedTime: '08:00 AM',
        completed: false
      },
      {
        id: 'stop-13',
        name: 'Business District',
        coordinates: [40.7282, -74.0776],
        estimatedTime: '08:30 AM',
        completed: false
      },
      {
        id: 'stop-14',
        name: 'South Terminal',
        coordinates: [40.6892, -74.0445],
        estimatedTime: '09:00 AM',
        completed: false
      }
    ],
    route: [
      [40.7831, -73.9712],
      [40.7614, -73.9776],
      [40.7282, -74.0776],
      [40.6892, -74.0445]
    ]
  }
];