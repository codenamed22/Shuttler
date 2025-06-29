import { useEffect, useRef } from "react";

/* ─────────── message shapes from /ws/eta ─────────── */

export interface ArrivedMsg {
  busId: string;
  arrivedStops: string[];                 // e.g. ["stop_kc_1"]
  arrivalTimes: Record<string, number>;   // ms since epoch
}

export interface PredictionMsg {
  busId: string;
  etaPerStop: Record<string, number>;     // ms since epoch or -1
}

/* ─────────── hook ─────────── */

type ArrivedHandler    = (msg: ArrivedMsg)    => void;
type PredictionHandler = (msg: PredictionMsg) => void;

const WS_BASE =
  (import.meta.env.VITE_WS_BASE as string | undefined) ??
  "ws://localhost:8080";

/**
 * Opens ONE WebSocket to /ws/eta for the given busId.
 *  • onArrived     → called for arrivalTimes / arrivedStops frames
 *  • onPrediction  → called for etaPerStop frames
 */
export function useEtaSocket(
  busId: string | undefined,
  onArrived: ArrivedHandler,
  onPrediction: PredictionHandler
) {
  const wsRef = useRef<WebSocket>();

  useEffect(() => {
    /* no bus selected → nothing to do */
    if (!busId) return;

    const ws = new WebSocket(`${WS_BASE}/ws/eta?busId=${encodeURIComponent(busId)}`);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if ("etaPerStop" in data) {
          onPrediction(data as PredictionMsg);
        } else if ("arrivedStops" in data) {
          onArrived(data as ArrivedMsg);
        }
      } catch (_) {
        /* ignore bad payloads */
      }
    };

    /* cleanup when busId changes or component unmounts */
    return () => ws.close();
  }, [busId, onArrived, onPrediction]);
}