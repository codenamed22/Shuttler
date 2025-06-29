import React, { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { Icon, divIcon, Marker as LeafletMarker } from "leaflet";
import { getDistance as geoDist } from "geolib";              // ← NEW
import { Bus as BusType } from "../types";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  bus: BusType;
}

/* ─────────── custom icons ─────────── */
const busIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#2563eb" stroke="white" stroke-width="4"/>
        <path d="M8 12h16v8H8v-8zm2 2v4h2v-4h-2zm6 0v4h2v-4h-2zm6 0v4h2v-4h-2z" fill="white"/>
      </svg>
    `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const completedStopIcon = divIcon({
  html: `<div class="w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const pendingStopIcon = divIcon({
  html: `<div class="w-4 h-4 bg-gray-400 border-2 border-white rounded-full shadow-lg"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/* Center the map whenever the bus moves */
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ bus }) => {
  const markerRef = useRef<LeafletMarker>(null);

  /* Smooth-update marker */
  useEffect(() => {
    markerRef.current?.setLatLng([bus.currentLocation[0], bus.currentLocation[1]]);
  }, [bus.currentLocation]);

  /* ───── dynamic polyline based on current GPS ───── */
  const closestIndex = bus.route.findIndex(
    ([lat, lon]) =>
      geoDist(
        { latitude: lat, longitude: lon },
        { latitude: bus.currentLocation[0], longitude: bus.currentLocation[1] }
      ) < 30 // m radius considered “reached”
  );

  const completedRoute =
    closestIndex >= 0 ? bus.route.slice(0, closestIndex + 1) : [];
  const remainingRoute =
    closestIndex >= 0 ? bus.route.slice(closestIndex) : bus.route;

  /* helpers for live times */
  const getMinutesRemaining = (eta: number | string) => {
    const time = typeof eta === "string" ? new Date(eta).getTime() : eta;
    return Math.max(0, Math.round((time - Date.now()) / 60000));
  };
  const getRelativeTime = (time: number | string) => {
    const t = typeof time === "string" ? new Date(time).getTime() : time;
    const minsAgo = Math.round((Date.now() - t) / 60000);
    return `${minsAgo} min ago`;
  };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={bus.currentLocation}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={bus.currentLocation} />

        {/* live bus marker */}
        <Marker ref={markerRef} position={bus.currentLocation} icon={busIcon}>
          <Popup>
            <div className="text-center">
              <h3 className="font-semibold">{bus.name}</h3>
              <p className="text-sm text-gray-600">Driver: {bus.driver}</p>
              <p className="text-sm text-gray-600">Status: {bus.status}</p>
            </div>
          </Popup>
        </Marker>

        {/* stops */}
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
                    Departed{" "}
                    {stop.departureTime
                      ? getRelativeTime(stop.departureTime)
                      : "—"}
                  </p>
                ) : (
                  <p className="text-sm text-blue-600">
                    {stop.estimatedTime
                      ? `Arriving in ${getMinutesRemaining(
                          stop.estimatedTime
                        )} min`
                      : "ETA unavailable"}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* route polylines */}
        {completedRoute.length > 1 && (
          <Polyline
            positions={completedRoute}
            color="#9CA3AF"
            weight={6}
            opacity={0.8}
          />
        )}
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