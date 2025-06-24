import React from 'react';
import { CheckCircle, Clock, MapPin } from 'lucide-react';
import { BusStop } from '../types';
import { clsx } from 'clsx';

interface StopsListProps {
  stops: BusStop[];
}

export const StopsList: React.FC<StopsListProps> = ({ stops }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Stops</h3>
      
      <div className="space-y-4">
        {stops.map((stop, index) => (
          <div key={stop.id} className="flex items-start space-x-4">
            <div className="flex flex-col items-center">
              <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center",
                stop.completed 
                  ? "bg-success-100 text-success-600" 
                  : "bg-gray-100 text-gray-400"
              )}>
                {stop.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              {index < stops.length - 1 && (
                <div className={clsx(
                  "w-0.5 h-12 mt-2",
                  stop.completed ? "bg-success-200" : "bg-gray-200"
                )} />
              )}
            </div>
            
            <div className="flex-1 pb-8">
              <div className="flex items-center justify-between">
                <h4 className={clsx(
                  "font-medium",
                  stop.completed ? "text-gray-900" : "text-gray-600"
                )}>
                  {stop.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {stop.completed ? stop.departureTime : stop.estimatedTime}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-1">
                {stop.completed ? (
                  <span className="text-success-600 font-medium">✓ Completed</span>
                ) : (
                  <span className="text-blue-600">Approaching</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};