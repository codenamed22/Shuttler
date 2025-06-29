import React from "react";
import { CheckCircle, Clock, MapPin } from "lucide-react";
import { BusStop } from "../types";
import clsx from "clsx";
import { minsAgo, minsAhead, toMillis } from "../utils/time";

interface StopsListProps {
  stops: BusStop[];
}

export const StopsList: React.FC<StopsListProps> = ({ stops }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Stops</h3>

      <div className="space-y-4">
        {stops.map((stop, idx) => {
          const done = stop.completed;
          const depMs = stop.departureTime ? toMillis(stop.departureTime) : null;
          const etaMs = stop.estimatedTime ? toMillis(stop.estimatedTime) : null;

          return (
            <div key={stop.id} className="flex items-start space-x-4">
              {/* timeline dot + line */}
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    done
                      ? "bg-success-100 text-success-600"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {done ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                {idx < stops.length - 1 && (
                  <div
                    className={clsx(
                      "w-0.5 h-12 mt-2",
                      done ? "bg-success-200" : "bg-gray-200"
                    )}
                  />
                )}
              </div>

              {/* stop details */}
              <div className="flex-1 pb-8">
                <div className="flex items-center justify-between">
                  <h4
                    className={clsx(
                      "font-medium",
                      done ? "text-gray-900" : "text-gray-600"
                    )}
                  >
                    {stop.name}
                  </h4>

                  {/* live clock / relative time */}
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />

                    {/* departed stop → show clock + how long ago */}
                    {done && depMs && (
                      <>
                        <span className="text-gray-500">
                          {new Date(depMs).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-gray-400">
                          ({minsAgo(depMs)} min&nbsp;ago)
                        </span>
                      </>
                    )}

                    {/* upcoming stop → ETA in X min */}
                    {!done && etaMs && (
                      <span className="text-blue-600">
                        in&nbsp;{minsAhead(etaMs)} min
                      </span>
                    )}

                    {/* no data fallback */}
                    {!done && !etaMs && (
                      <span className="text-gray-400">ETA&nbsp;–</span>
                    )}
                  </div>
                </div>

                {/* status line */}
                <p className="text-sm mt-1">
                  {done ? (
                    <span className="text-success-600 font-medium">
                      ✓ Completed
                    </span>
                  ) : etaMs ? (
                    <span className="text-blue-600">Approaching</span>
                  ) : (
                    <span className="text-gray-500">No ETA</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};