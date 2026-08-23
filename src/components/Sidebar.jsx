import React, { useState } from "react";

export default function Sidebar({ activeTab, setActiveTab }) {
  const [collapsed, setCollapsed] = useState(false);

  const menuGroups = [
    {
      group: "Core Operations",
      items: [
        { id: "instant-orders", label: "Instant Orders", icon: "⚡", badge: "POS" },
        { id: "manage-orders", label: "Manage Orders", icon: "📦" },
        { id: "manage-inventory", label: "Manage Inventory", icon: "📊" },
      ]
    },
    {
      group: "Store Administration",
      items: [
        { id: "manage-shop", label: "Manage Shop", icon: "🏪" },
        { id: "manage-staff", label: "Manage Staff", icon: "👥" },
        { id: "manage-category", label: "Manage Category", icon: "🏷️" },
      ]
    },
    {
      group: "System & Settings",
      items: [
        { id: "website-settings", label: "Website Settings", icon: "🌐" },
        { id: "configurations", label: "Configurations", icon: "⚙️" },
        { id: "admin-settings", label: "Admin Settings", icon: "🛡️" },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar Header / Brand Toggle */}
      <div className="sidebar-header">
        <div className="brand-logo">
          <div className="logo-icon">Z</div>
          {!collapsed && <span className="brand-name">Zinzira<span className="accent">OS</span></span>}
        </div>
        <button 
          className="collapse-toggle" 
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="nav-group">
            {!collapsed && <div className="group-title">{group.group}</div>}
            {group.items.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                  </>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer / Session Action */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          {!collapsed && <span>Exit Session</span>}
        </button>
      </div>
    </aside>
  );
}