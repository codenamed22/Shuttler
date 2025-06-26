import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  Bus as BusIcon,
  Users,
  Clock,
  Navigation,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import { MapView } from '../components/MapView';
import { StopsList } from '../components/StopsList';
import { useLiveBuses } from '../context/LiveBusContext';
import { Bus as BusType } from '../types';
import { clsx } from 'clsx';

export const BusTrackingPage: React.FC = () => {
  /* ---------- Route param ---------- */
  const { busId } = useParams<{ busId: string }>();

  /* ---------- Live data ---------- */
  const buses         = useLiveBuses();      // { [busId]: Bus }
  const bus: BusType | undefined = busId ? buses[busId] : undefined;

  /* ---------- Timestamp of last WS ping ---------- */
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  /* When a new ping arrives for this bus, bump the timestamp */
  useEffect(() => {
    if (bus) setLastUpdated(new Date());
  }, [bus?.currentLocation?.[0], bus?.currentLocation?.[1]]); // lat/lon change → new ping

  /* ---------- Loading & not-found states ---------- */
  if (!busId) return <Navigate to="/" replace />;

  // While we haven’t received the first ping yet, show a spinner
  if (!bus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Waiting for live data…</p>
        </div>
      </div>
    );
  }

  /* ---------- Status helpers ---------- */
  const statusConfig = {
    active: {
      color: 'bg-success-500',
      text: 'Active',
      description: 'Bus is running on schedule',
    },
    delayed: {
      color: 'bg-warning-500',
      text: 'Delayed',
      description: 'Bus is running behind schedule',
    },
    completed: {
      color: 'bg-gray-500',
      text: 'Completed',
      description: 'Bus has completed its route',
    },
  } as const;

  const currentStatus = statusConfig[bus.status];
  const occupancyPercentage = (bus.occupancy / bus.capacity) * 100;
  const completedStops = bus.stops.filter((stop) => stop.completed).length;

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      {/* Bus Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-4 rounded-xl">
              <BusIcon className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {bus.name}
              </h1>
              <p className="text-gray-600">
                {bus.origin} → {bus.destination}
              </p>
              <p className="text-sm text-gray-500 mt-1">Driver: {bus.driver}</p>
            </div>
          </div>

          <div className="text-right">
            <div
              className={clsx(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white mb-2',
                currentStatus.color
              )}
            >
              {bus.status === 'active' && (
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              )}
              {currentStatus.text}
            </div>
            <p className="text-xs text-gray-500">
              {currentStatus.description}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Occupancy */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">
                Occupancy
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {bus.occupancy}/{bus.capacity}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={clsx(
                  'h-2 rounded-full transition-all duration-300',
                  occupancyPercentage > 80
                    ? 'bg-warning-500'
                    : occupancyPercentage > 60
                    ? 'bg-yellow-400'
                    : 'bg-success-500'
                )}
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">
                Progress
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {completedStops}/{bus.stops.length}
            </div>
            <div className="text-sm text-gray-500">Stops completed</div>
          </div>

          {/* Location */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Navigation className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">
                Location
              </span>
            </div>
            <div className="text-sm font-mono text-gray-900">
              {bus.currentLocation[0].toFixed(4)},{' '}
              {bus.currentLocation[1].toFixed(4)}
            </div>
            <div className="text-xs text-gray-500">Live coordinates</div>
          </div>

          {/* Contact */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Phone className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Contact</span>
            </div>
            <button className="text-sm bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 transition-colors">
              Call Driver
            </button>
          </div>
        </div>

        {/* Service Alert */}
        {bus.status === 'delayed' && (
          <div className="mt-4 bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
              <span className="font-medium text-warning-800">Service Alert</span>
            </div>
            <p className="text-warning-700 mt-1">
              This bus is currently running behind schedule due to traffic
              conditions. Estimated delay: 10–15 minutes.
            </p>
          </div>
        )}
      </div>

      {/* Map & Stops */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Live Route Map
            </h2>
            <MapView bus={bus} />
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  <span>Completed Route</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-primary-600 rounded-full"></div>
                  <span>Remaining Route</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse"></div>
                <span>Live tracking active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stops list */}
        <div className="lg:col-span-1">
          <StopsList stops={bus.stops} />
        </div>
      </div>
    </div>
  );
};
