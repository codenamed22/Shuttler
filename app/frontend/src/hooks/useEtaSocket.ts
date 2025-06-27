import { useEffect, useRef } from "react";

interface EtaMsg {
  busId: string;
  stopId: string;
  actualArrival: string | null;
  predictions: { "10": string | null; "20": string | null; "30": string | null };
}

type Listener = (msg: EtaMsg) => void;

const WS_BASE =
  (import.meta.env.VITE_WS_BASE as string | undefined) ?? "ws://localhost:8080";

export function useEtaSocket(busId: string | undefined, onMessage: Listener) {
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    /* connect once; filter later */
    const connect = () => {
      const ws = new WebSocket(`${WS_BASE}/ws/eta`);
      wsRef.current = ws;

      ws.addEventListener("message", (ev) => {
        try {
          const data: EtaMsg = JSON.parse(ev.data);
          if (!busId || data.busId === busId) onMessage(data);
        } catch {
          console.warn("Bad ETA payload:", ev.data);
        }
      });

      ws.addEventListener("close", () => {
        console.warn("ETA socket closed. Reconnecting in 2 s…");
        timerRef.current = setTimeout(connect, 2000);
      });

      ws.addEventListener("error", () => ws.close());
    };

    connect();

    return () => {
      timerRef.current && clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [busId, onMessage]);
}
