import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  useEtaSocket,
  ArrivedMsg,
  PredictionMsg,
} from "../hooks/useEtaSocket";
import { toMillis } from "../utils/time";

/* ─────────── types ─────────── */
interface BusMeta {
  id: string;
  name: string;
}

interface StopEta {
  stopId: string;
  stopName: string;
  actualArrival: number | string | null;
  predictions: {
    "10": number | string | null;
    "20": number | string | null;
    "30": number | string | null;
  };
}

/* ─────────── helpers ─────────── */
const API_BASE = (import.meta.env.VITE_API_BASE ?? "/api").replace(/\/$/, "");

const fetchBuses = async (): Promise<BusMeta[]> => {
  const res = await fetch(`${API_BASE}/buses`);
  if (!res.ok) throw new Error("Failed to fetch bus list");
  return res.json();
};

const fetchEtaByBusAndDay = async (
  busId: string,
  date: string
): Promise<StopEta[]> => {
  if (!busId) return [];
  const res = await fetch(
    `${API_BASE}/eta?busId=${encodeURIComponent(busId)}&date=${date}`
  );
  if (!res.ok) throw new Error("Failed to fetch ETA data");
  return res.json();
};

const fmtTime = (t: number | string | null) =>
  t ? format(new Date(toMillis(t)), "HH:mm") : "—";

const msgForPending = (mins: 10 | 20 | 30) => `No data ${mins} min before`;

/* ─────────── component ─────────── */

const BusEtaTable: React.FC = () => {
  const [busList, setBusList] = useState<BusMeta[]>([]);
  const [selectedBus, setSelectedBus] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [etas, setEtas] = useState<StopEta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBuses()
      .then(setBusList)
      .catch((err) => setError(err.message));
  }, []);

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
    const interval = setInterval(loadEtas, 300_000); // 5 minutes
    return () => clearInterval(interval);
  }, [loadEtas]);

  const handleArrived = useCallback((msg: ArrivedMsg) => {
    setEtas((prev) =>
      prev.map((row) =>
        msg.arrivedStops.includes(row.stopId)
          ? { ...row, actualArrival: msg.arrivalTimes[row.stopId] }
          : row
      )
    );
  }, []);

  const handlePrediction = useCallback((msg: PredictionMsg) => {
    setEtas((prev) =>
      prev.map((row) =>
        msg.etaPerStop[row.stopId]
          ? {
              ...row,
              predictions: {
                ...row.predictions,
                "10": msg.etaPerStop[row.stopId],
              },
            }
          : row
      )
    );
  }, []);

  useEtaSocket(selectedBus, handleArrived, handlePrediction);

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
              <option key={b.id} value={b.id}>
                {b.name}
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

      {error && (
        <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>
      )}

      {/* ETA Table */}
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
            {etas.map((s) => {
              const done = Boolean(s.actualArrival);
              return (
                <tr
                  key={s.stopId}
                  className={done ? "bg-gray-100 text-gray-500" : ""}
                >
                  <td className="whitespace-nowrap px-4 py-2 text-sm font-medium">
                    {s.stopName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm">
                    {done ? fmtTime(s.actualArrival) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm">
                    {s.predictions["10"]
                      ? fmtTime(s.predictions["10"])
                      : msgForPending(10)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm">
                    {s.predictions["20"]
                      ? fmtTime(s.predictions["20"])
                      : msgForPending(20)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm">
                    {s.predictions["30"]
                      ? fmtTime(s.predictions["30"])
                      : msgForPending(30)}
                  </td>
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