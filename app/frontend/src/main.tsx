import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LiveBusProvider } from './context/LiveBusContext';   
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LiveBusProvider>
        <App />
      </LiveBusProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
