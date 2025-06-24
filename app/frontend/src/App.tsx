import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { BusTrackingPage } from './pages/BusTrackingPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tracking/:busId" element={<BusTrackingPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;