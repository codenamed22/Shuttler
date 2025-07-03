import '@testing-library/jest-dom';

(global as any).import = {
  meta: {
    env: {
      VITE_API_BASE: 'http://localhost:8080/api/dashboard',
      VITE_WS_BASE:  'ws://localhost:8080',
    },
  },
};
