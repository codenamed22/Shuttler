import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import { Bus as BusType } from '../types';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  bus: BusType;
}

// Custom bus icon
const busIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#2563eb" stroke="white" stroke-width="4"/>
      <path d="M8 12h16v8H8v-8zm2 2v4h2v-4h-2zm6 0v4h2v-4h-2zm6 0v4h2v-4h-2z" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Custom stop icons
const completedStopIcon = divIcon({
  html: `<div class="w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const pendingStopIcon = divIcon({
  html: `<div class="w-4 h-4 bg-gray-400 border-2 border-white rounded-full shadow-lg"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ bus }) => {
  const mapRef = useRef<any>(null);

  const completedRoute = bus.route.slice(0, bus.completedRouteIndex + 1);
  const remainingRoute = bus.route.slice(bus.completedRouteIndex);

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        ref={mapRef}
        center={bus.currentLocation}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={bus.currentLocation} />
        
        {/* Bus current location */}
        <Marker position={bus.currentLocation} icon={busIcon}>
          <Popup>
            <div className="text-center">
              <h3 className="font-semibold">{bus.name}</h3>
              <p className="text-sm text-gray-600">Driver: {bus.driver}</p>
              <p className="text-sm text-gray-600">Status: {bus.status}</p>
            </div>
          </Popup>
        </Marker>

        {/* Bus stops */}
        {bus.stops.map((stop) => (
          <Marker
            key={stop.id}
            position={stop.coordinates}
            icon={stop.completed ? completedStopIcon : pendingStopIcon}
          >
            <Popup>
              <div>
                <h4 className="font-semibold">{stop.name}</h4>
                {stop.completed ? (
                  <p className="text-sm text-green-600">
                    Departed: {stop.departureTime}
                  </p>
                ) : (
                  <p className="text-sm text-blue-600">
                    ETA: {stop.estimatedTime}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Completed route (gray) */}
        {completedRoute.length > 1 && (
          <Polyline
            positions={completedRoute}
            color="#9CA3AF"
            weight={6}
            opacity={0.8}
          />
        )}

        {/* Remaining route (blue) */}
        {remainingRoute.length > 1 && (
          <Polyline
            positions={remainingRoute}
            color="#2563EB"
            weight={4}
            opacity={0.9}
          />
        )}
      </MapContainer>
    </div>
  );
};