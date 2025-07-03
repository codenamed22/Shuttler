/* ------------------------------------------------------------------
 * gpsSocket.ts
 *  – Singleton WebSocket client for /ws/eta
 *  – Reconnects with exponential back-off
 *  – Fan-outs validated PingMessage objects to any number of listeners
 * ------------------------------------------------------------------ */

const WS_BASE =
  (import.meta.env.VITE_WS_BASE as string | undefined) ?? 'ws://localhost:8080';

/* ---------- data coming from the backend ---------- */
export interface PingMessage {
  busId: string;
  lat: number | null;
  lon: number | null;
  timestamp: number;                 // seconds or ms – your consumer decides
  arrivedStops: string[];
  arrivalTimes?: Record<string, number>;
  occupancy?: number; 
}

/* ---------- listener type ---------- */
type Listener = (msg: PingMessage) => void;

/* ------------------------------------------------------------------
 * GPSSocket  – use `GPSSocket.get()`  or  `gpsSocket`
 * ------------------------------------------------------------------ */
export class GPSSocket {
  /* ------------- singleton helper ------------- */
  private static _inst: GPSSocket;
  static get = () => (this._inst ??= new GPSSocket());

  /* ------------- internals ------------- */
  private listeners = new Set<Listener>();
  private ws?: WebSocket;
  private retry = 0;
  private readonly MAX_RETRY_DELAY = 30_000; // 30s

  private constructor() {
    this.open();
    // uncomment if you want tab-life keep-alive (30 s)
    // setInterval(() => this.ping(), 30_000);
  }

  /* ---------- public API ---------- */
  onPing(fn: Listener)  { this.listeners.add(fn); }
  offPing(fn: Listener) { this.listeners.delete(fn); }

  /** Clean close – called by React cleanup or on page unload */
  close() {
    if (!this.ws) return;
    if (
      this.ws.readyState === WebSocket.OPEN ||
      this.ws.readyState === WebSocket.CONNECTING
    ) {
      this.ws.close(1000, 'client closed');
    }
  }

  /* ---------- connection logic ---------- */
  private open() {
    const url = `${WS_BASE.replace(/\/+$/, '')}/ws/eta`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.info('🌐 GPS connected');
      this.retry = 0;
    };

    this.ws.onerror = (e) => console.error('🌐 GPS error', e);

    this.ws.onclose = (e) => {
      console.warn(`🌐 GPS closed (${e.code})`, e.reason ?? '');
      if (e.code !== 1000) this.reconnect();
    };

    this.ws.onmessage = (ev) => {
      try {
        const raw = JSON.parse(ev.data);
        if (typeof raw?.busId === 'string') {
          this.listeners.forEach((l) => l(raw));
        } else {
          console.warn('🌐 GPS bad payload', raw);
        }
      } catch (err) {
        console.error('🌐 GPS JSON parse fail', err);
      }
    };
  }

  private reconnect() {
    this.retry += 1;
    const delay = Math.min(1000 * 2 ** this.retry, this.MAX_RETRY_DELAY);
    console.info(`🌐 GPS retry in ${delay} ms`);
    setTimeout(() => this.open(), delay);
  }

  /* ---------- (optional) heartbeat ---------- */
  private ping() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send('{"type":"ping"}');
      } catch (_) { /* ignore */ }
    }
  }
}

/* Singleton convenience */
export const gpsSocket = GPSSocket.get();
