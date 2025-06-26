import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { BusTrackingPage } from './pages/BusTrackingPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tracking/:busId" element={<BusTrackingPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
