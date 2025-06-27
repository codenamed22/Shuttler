// src/services/gpsSocket.ts
const WS_BASE =
  (import.meta.env.VITE_WS_BASE as string | undefined) ?? "ws://localhost:8080";

export interface PingMessage {
  busId: string;
  lat: number;
  lon: number;
  timestamp: number;
  arrivedStops: string[];      // from backend payload
}

export class GPSSocket {
  private ws: WebSocket;

  constructor() {
    this.ws = new WebSocket(`${WS_BASE}/ws/eta`);   // ✅ backend stream
  }

  onPing(cb: (p: PingMessage) => void) {
    this.ws.onmessage = (ev) => {
      try {
        cb(JSON.parse(ev.data) as PingMessage);
      } catch {
        console.warn("Bad GPS payload:", ev.data);
      }
    };
  }

  close() {
    this.ws.close();
  }
}