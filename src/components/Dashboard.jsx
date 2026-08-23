import React, { useState } from "react";
import Sidebar from "./Sidebar";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("instant-orders");

  return (
    <div className="dashboard-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="dashboard-workspace">
        <header className="workspace-header">
          <h2>{activeTab.replace("-", " ").toUpperCase()}</h2>
        </header>

        <section className="workspace-content">
          {activeTab === "instant-orders" && (
            <div className="placeholder-card">⚡ POS Terminal & Rapid Checkout Panel</div>
          )}
          {activeTab === "manage-inventory" && (
            <div className="placeholder-card">📊 Real-Time Inventory Control</div>
          )}
          {activeTab === "manage-orders" && (
            <div className="placeholder-card">📦 Order Processing Engine</div>
          )}
          {activeTab === "manage-shop" && (
            <div className="placeholder-card">🏪 Shop Profile & Outlets Configuration</div>
          )}
          {activeTab === "manage-staff" && (
            <div className="placeholder-card">👥 Staff Permissions & Access Levels</div>
          )}
          {activeTab === "manage-category" && (
            <div className="placeholder-card">🏷️ Product Categories Hierarchy</div>
          )}
          {activeTab === "website-settings" && (
            <div className="placeholder-card">🌐 Web Portal Customizations</div>
          )}
          {activeTab === "configurations" && (
            <div className="placeholder-card">⚙️ Global System Parameters</div>
          )}
          {activeTab === "admin-settings" && (
            <div className="placeholder-card">🛡️ Administrative Security Center</div>
          )}
        </section>
      </main>
    </div>
  );
}