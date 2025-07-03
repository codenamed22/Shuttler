// top of LiveBusContext.test.tsx  (before imports)
jest.mock('../services/gpsSocket', () => {
  const listeners: any[] = [];
  return {
    __esModule: true,
    gpsSocket: {
      connect: jest.fn(),
      disconnect: jest.fn(),
      onPing:  (cb: any) => listeners.push(cb),
      close:   jest.fn(),                 // ← added
      // helper so tests can send pings if needed
      _emitPing: (ping: any) => listeners.forEach(fn => fn(ping)),
    },
  };
});

// mock BusEtaTable (contains import.meta)
jest.mock('../components/BusEtaTable', () => () => (
  <div data-testid="mock-table" />
));

import { render, screen } from '@testing-library/react';
import { LiveBusProvider } from './LiveBusContext';
import Dashboard from '../pages/Dashboard';

test('renders dashboard without crashing', () => {
  render(
    <LiveBusProvider>
      <Dashboard />
    </LiveBusProvider>
  );

  // assert the heading exists
  expect(screen.getByRole('heading', { name: /bus eta dashboard/i })).toBeInTheDocument();
});
