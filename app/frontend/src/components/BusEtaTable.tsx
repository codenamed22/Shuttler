import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { toMillis } from "../utils/time";

/* ─────────── types ─────────── */
interface BusMeta { id: string }

/**
 * One row of the ETA dashboard.
 * – `actualArrival` is the ground‑truth timestamp when the bus checked‑in.
 * – `predictions` holds the three snapshots we capture 10/5/2 min **before** that arrival.
 */
interface StopEta {
  stopId: string;
  stopName: string;
  actualArrival: number | string | null;
  predictions: {
    "5": number | string | null;
    "3": number | string | null;
    "2": number | string | null;
  };
}

/* ─────────── helpers ─────────── */
// Point this straight at Spring. Can be overridden via VITE_API_BASE.
const API_BASE = (
  import.meta.env.VITE_API_BASE ?? "http://localhost:8080/api/dashboard"
).replace(/\/$/, "");

const fetchBuses = async (): Promise<string[]> => {
  const res = await fetch(`${API_BASE}/buses`);
  if (!res.ok) throw new Error("Unable to load bus list from server");
  return res.json();
};

const fetchEtaByBusAndDay = async (
  busId: string,
  date: string
): Promise<StopEta[]> => {
  if (!busId) return [];
  const res = await fetch(
    `${API_BASE}/bus/${encodeURIComponent(busId)}/date/${date}`
  );
  if (!res.ok) throw new Error("Unable to load ETA data from server");
  const raw = await res.json();
  return raw.map((row: any) => ({
    stopId: row.stopId,
    stopName: row.stopName,
    actualArrival: row.actualArrival,
    predictions: {
      "5": row.eta5minBefore,
      "3": row.eta3minBefore,
      "2": row.eta2minBefore,
    },
  }));
};

const fmtTime = (t: number | string | null) =>
  t ? format(new Date(toMillis(t)), "HH:mm") : "—";
const msgForPending = (mins: 5 | 3 | 2) => `No data ${mins}\u00A0min before`;

/* ─────────── component ─────────── */
const BusEtaTable: React.FC = () => {
  const [busList, setBusList] = useState<string[]>([]);
  const [selectedBus, setSelectedBus] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [etas, setEtas] = useState<StopEta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Load bus dropdown once */
  useEffect(() => {
    fetchBuses().then(setBusList).catch((err) => setError(err.message));
  }, []);

  /* Fetch dashboard rows – initial + every 5 min */
  const loadEtas = useCallback(() => {
    if (!selectedBus) return;
    setIsLoading(true);
    fetchEtaByBusAndDay(selectedBus, selectedDate)
      .then(setEtas)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [selectedBus, selectedDate]);

  useEffect(() => {
    loadEtas();
    const id = setInterval(loadEtas, 300_000);
    return () => clearInterval(id);
  }, [loadEtas]);

  /* ————— Friendly full‑screen error ————— */
  if (error) {
    const handleRetry = () => {
      setError(null);
      loadEtas();
    };

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-semibold text-red-600">Oops! Something went wrong.</h2>
        <p className="max-w-md text-center text-sm text-gray-600">
          {error}
        </p>
        <button
          onClick={handleRetry}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-medium">Bus</span>
          <select
            className="rounded border px-2 py-1"
            value={selectedBus}
            onChange={(e) => setSelectedBus(e.target.value)}
          >
            <option value="" disabled>
              Select bus
            </option>
            {busList.map((b) => (
             <option key={b} value={b}>
              {b}
             </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 font-medium">Day</span>
          <input
            type="date"
            className="rounded border px-2 py-1"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                Stop
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                Actual arrival
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                ETA (-5 min)
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                ETA (-3 min)
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                ETA (-2 min)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {!isLoading && etas.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-3 text-center text-sm text-gray-500"
                >
                  {selectedBus ? "No data for this day" : "Select a bus first"}
                </td>
              </tr>
            )}
            {etas.map((s, idx) => {
              const origin = idx === 0; // first stop is the route origin
              const done = Boolean(s.actualArrival);
              const cellClass = "whitespace-nowrap px-4 py-2 text-sm";

              // Helper to decide what to render in the ETA cells
              const renderEta = (
                value: number | string | null,
                mins: 5 | 3 | 2
              ) => (origin ? "Origin" : value ? fmtTime(value) : msgForPending(mins));

              return (
                <tr
                  key={s.stopId}
                  className={done ? "bg-gray-100 text-gray-500" : ""}
                >
                  <td className={`${cellClass} font-medium`}>{s.stopName}</td>
                  <td className={cellClass}>
                    {done ? fmtTime(s.actualArrival) : "—"}
                  </td>
                  <td className={cellClass}>{renderEta(s.predictions["5"], 5)}</td>
                  <td className={cellClass}>{renderEta(s.predictions["3"], 3)}</td>
                  <td className={cellClass}>{renderEta(s.predictions["2"], 2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusEtaTable;