import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // any request the frontend makes to /routes/... is tunneled to 8000
      '/routes': 'http://localhost:8000'
    }
  }
});
