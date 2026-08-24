import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-workspace">
        <section className="workspace-content">
          <Outlet /> {/* Renders Inventory.jsx, InstantOrders.jsx, etc. */}
        </section>
      </main>
    </div>
  );
}