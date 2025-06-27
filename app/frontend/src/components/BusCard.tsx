import React from 'react';
import { Link } from 'react-router-dom';
import { Bus as BusIcon, MapPin, Clock, Users } from 'lucide-react';
import { Bus as BusType } from '../types';
import { clsx } from 'clsx';

interface BusCardProps {
  bus: BusType;
}

export const BusCard: React.FC<BusCardProps> = ({ bus }) => {
  //status colour: bus delayed, active or completee
  const statusConfig = {
    active:    { color: 'bg-success-500',  text: 'Active',    icon: '🟢' },
    delayed:   { color: 'bg-warning-500',  text: 'Delayed',   icon: '🟡' },
    completed: { color: 'bg-gray-500',     text: 'Completed', icon: '⚪' }
  } as const;

  const currentStatus = statusConfig[bus.status];
  const occupancyPct  = (bus.occupancy / bus.capacity) * 100;

  return (
    <Link to={`/tracking/${bus.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-3 rounded-lg">
              <BusIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{bus.name}</h3>
              <p className="text-sm text-gray-500">Driver&nbsp;{bus.driver}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span>{currentStatus.icon}</span>
            <span
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium text-white',
                currentStatus.color
              )}
            >
              {currentStatus.text}
            </span>
          </div>
        </div>

        {/* Route summary */}
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-2 text-primary-500" />
          <span className="text-sm font-medium">
            {bus.origin}&nbsp;→&nbsp;{bus.destination}
          </span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Occupancy */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Occupancy</span>
                <span>
                  {bus.occupancy}/{bus.capacity}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={clsx(
                    'h-2 rounded-full transition-all duration-300',
                    occupancyPct > 80
                      ? 'bg-warning-500'
                      : occupancyPct > 60
                      ? 'bg-yellow-400'
                      : 'bg-success-500'
                  )}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stops progress */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-600">Stops</p>
              <p className="text-sm font-medium">
                {bus.stops.filter(s => s.completed).length}/{bus.stops.length}
              </p>
            </div>
          </div>
        </div>

        {//Route progress bar
        }
        <div className="border-t pt-3">
          <p className="text-xs text-gray-500 mb-2">Route Progress</p>
          <div className="flex space-x-1">
            {bus.stops.map(stop => (
              <div
                key={stop.id}
                className={clsx(
                  'flex-1 h-2 rounded-full',
                  stop.completed ? 'bg-success-500' : 'bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};