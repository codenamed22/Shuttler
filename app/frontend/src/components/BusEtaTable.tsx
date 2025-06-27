import React, { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";

// ---------------------------------------------------------------------------
// Types ---------------------------------------------------------------------
// ---------------------------------------------------------------------------

interface BusMeta {
  id: string;
  name: string;
}

interface StopEta {
  stopId: string;
  stopName: string;
  actualArrival: string | null; // ISO string or null if not yet arrived
  predictions: {
    "10": string | null; // ISO string representing ETA 10 min before arrival
    "20": string | null;
    "30": string | null;
  };
}

// Endpoint helpers -----------------------------------------------------------
// For Vite, use import.meta.env instead of process.env
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? ""; // e.g. "https://shuttle.example.com";

const fetchBuses = async (): Promise<BusMeta[]> => {
  const res = await fetch(`${API_BASE}/buses`);
  if (!res.ok) throw new Error("Failed to fetch bus list");
  return res.json();
};

const fetchEtaByBusAndDay = async (
  busId: string,
  date: string,
): Promise<StopEta[]> => {
  if (!busId) return [];
  const res = await fetch(
    `${API_BASE}/eta?busId=${encodeURIComponent(busId)}&date=${date}`,
  );
  if (!res.ok) throw new Error("Failed to fetch ETA data");
  return res.json();
};

// Utility --------------------------------------------------------------------
const fmtTime = (iso: string | null) =>
  iso ? format(parseISO(iso), "HH:mm") : "—";

const msgForPending = (mins: 10 | 20 | 30) =>
  `No data ${mins} min before`; // you can tweak message copy here

// ---------------------------------------------------------------------------
// Component ------------------------------------------------------------------
// ---------------------------------------------------------------------------

const BusEtaTable: React.FC = () => {
  const [busList, setBusList] = useState<BusMeta[]>([]);
  const [selectedBus, setSelectedBus] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [etas, setEtas] = useState<StopEta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Fetch bus list once on mount -------------------------------------------
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetchBuses()
      .then(setBusList)
      .catch((err) => setError(err.message));
  }, []);

  // -------------------------------------------------------------------------
  // Poll ETA data every 5 min ------------------------------------------------
  // -------------------------------------------------------------------------
  const loadEtas = useCallback(() => {
    if (!selectedBus) return;
    setIsLoading(true);
    fetchEtaByBusAndDay(selectedBus, selectedDate)
      .then(setEtas)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [selectedBus, selectedDate]);

  useEffect(() => {
    loadEtas(); // initial load
    const interval = setInterval(loadEtas, 300_000); // 5 min
    return () => clearInterval(interval);
  }, [loadEtas]);

  // -------------------------------------------------------------------------
  // Render -------------------------------------------------------------------
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Bus picker */}
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
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        {/* Day picker */}
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

      {/* Error state */}
      {error && (
        <p className="rounded bg-red-100 p-2 text-sm text-red-800">
          {error}
        </p>
      )}

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
                ETA (-10 min)
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                ETA (-20 min)
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                ETA (-30 min)
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
            {etas.map((s) => (
              <tr key={s.stopId}>
                <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">
                  {s.stopName}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  {s.actualArrival ? fmtTime(s.actualArrival) : "Not arrived"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  {s.predictions["10"]
                    ? fmtTime(s.predictions["10"]!)
                    : msgForPending(10)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  {s.predictions["20"]
                    ? fmtTime(s.predictions["20"]!)
                    : msgForPending(20)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  {s.predictions["30"]
                    ? fmtTime(s.predictions["30"]!)
                    : msgForPending(30)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusEtaTable;
