// gpsSocket.ts
export interface PingMessage {
  busId: string;
  lat: number;
  lon: number;
  index: number;
  timestamp: number;
}


type Listener = (msg: PingMessage) => void;

export class GPSSocket {
  private socket: WebSocket;
  private listeners: Listener[] = [];

  constructor(url = 'ws://localhost:8765') {
    this.socket = new WebSocket(url);
    this.socket.onmessage = e => {
      const msg = JSON.parse(e.data) as PingMessage;
      this.listeners.forEach(l => l(msg));
    };
  }

  onPing(cb: Listener) {
    this.listeners.push(cb);
  }

  close() {
    this.socket.close();
  }
}
