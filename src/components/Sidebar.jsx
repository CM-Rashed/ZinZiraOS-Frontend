import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const menuGroups = [
    {
      group: "Core Operations",
      items: [
        { path: "/instant-orders", label: "Instant Orders", icon: "⚡", badge: "POS" },
        { path: "/manage-orders", label: "Manage Orders", icon: "📦" },
        { path: "/manage-inventory", label: "Manage Inventory", icon: "📊" },
        { path: "/add-product", label: "Add Products", icon: "➕" },
        { path: "/manage-customer", label: "Manage Customer", icon: "👤" },
      ]
    },
    {
      group: "Store Administration",
      items: [
        { path: "/manage-shop", label: "Manage Shop", icon: "🏪" },
        { path: "/manage-staff", label: "Manage Staff", icon: "👥" },
        { path: "/manage-category", label: "Manage Category", icon: "🏷️" },
      ]
    },
    {
      group: "System & Settings",
      items: [
        { path: "/website-settings", label: "Website Settings", icon: "🌐" },
        { path: "/configurations", label: "Configurations", icon: "⚙️" },
        { path: "/admin-settings", label: "Admin Settings", icon: "🛡️" },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo">
          <div className="logo-icon">Z</div>
          {!collapsed && (
            <span className="brand-name">
              Zinzira<span className="accent">OS</span>
            </span>
          )}
        </div>
        <button 
          className="collapse-toggle" 
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="nav-group">
            {!collapsed && <div className="group-title">{group.group}</div>}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer / Session */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          {!collapsed && <span className="logout-label">Exit Session</span>}
        </button>
      </div>
    </aside>
  );
}