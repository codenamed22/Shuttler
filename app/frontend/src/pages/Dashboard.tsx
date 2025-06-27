// project/app/frontend/src/pages/Dashboard.tsx
import React from "react";
import BusEtaTable from "../components/BusEtaTable";

const Dashboard: React.FC = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Bus ETA Dashboard</h1>
    <BusEtaTable />
  </div>
);

export default Dashboard;   
