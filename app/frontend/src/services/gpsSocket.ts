// src/services/gpsSocket.ts
const WS_BASE =
  (import.meta.env.VITE_WS_BASE as string | undefined) ?? "ws://localhost:8080";

export interface PingMessage {
  busId: string;
  lat: number;
  lon: number;
  timestamp: number;
  arrivedStops: string[];                 // list of completed stops
  arrivalTimes?: Record<string, number>;  // optional epoch-ms per stop
}

type Listener = (msg: PingMessage) => void;

export class GPSSocket {
  private ws: WebSocket;

  constructor() {
    // single GPS/ETA feed socket
    this.ws = new WebSocket(`${WS_BASE}/ws/eta`);
  }

  /** Register a listener for each incoming GPS/ETA ping */
  onPing(cb: Listener) {
    this.ws.onmessage = (ev) => {
      try {
        cb(JSON.parse(ev.data) as PingMessage);
      } catch {
        console.warn("Bad GPS payload:", ev.data);
      }
    };
  }

  /** Close the WebSocket */
  close() {
    this.ws.close();
  }
}