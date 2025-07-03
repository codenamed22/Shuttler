export const gpsSocket = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  onMessage: jest.fn(),
};

// Re‑export types the code expects
export type PingMessage = {
  busId: string;
  lat: number;
  lng: number;
};
