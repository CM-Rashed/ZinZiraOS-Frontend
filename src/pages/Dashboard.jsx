import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
} from "lucide-react";

// Sample Analytics Data
const salesData = [
  { time: "08:00", sales: 1200, orders: 14 },
  { time: "10:00", sales: 2100, orders: 22 },
  { time: "12:00", sales: 4800, orders: 53 },
  { time: "14:00", sales: 3900, orders: 41 },
  { time: "16:00", sales: 6200, orders: 68 },
  { time: "18:00", sales: 8500, orders: 89 },
  { time: "20:00", sales: 5400, orders: 56 },
];

const categoryData = [
  { name: "Grocery", value: 45, color: "#a855f7" },
  { name: "Beverages", value: 25, color: "#6366f1" },
  { name: "Electronics", value: 18, color: "#ec4899" },
  { name: "Stationery", value: 12, color: "#14b8a6" },
];

const recentOrders = [
  { id: "#ORD-9482", items: "Organic Milk x2, Bread", total: "$14.50", status: "Completed", time: "2 mins ago" },
  { id: "#ORD-9481", items: "Wireless Mouse", total: "$29.99", status: "Processing", time: "5 mins ago" },
  { id: "#ORD-9480", items: "Energy Drink x4", total: "$12.00", status: "Completed", time: "12 mins ago" },
  { id: "#ORD-9479", items: "Whole Wheat Cereal", total: "$6.80", status: "Completed", time: "18 mins ago" },
];

export default function DashboardLayout() {
  const location = useLocation();
  const [timeRange, setTimeRange] = useState("Today");

  // Show internal metrics home view only when directly at base dashboard path
  const isBaseDashboard = location.pathname === "/" || location.pathname === "/instant-orders";

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-workspace">
        <section className="workspace-content">
          {isBaseDashboard ? (
            <div className="analytics-view">
              {/* Top Bar / Header Filter */}
              <div className="analytics-header">
                <div>
                  <h2 className="dashboard-heading">Retail Operations Hub</h2>
                  <p className="dashboard-subheading">Real-time performance metrics & store telemetry.</p>
                </div>
                <div className="time-filter">
                  {["Today", "Weekly", "Monthly"].map((range) => (
                    <button
                      key={range}
                      className={`filter-btn ${timeRange === range ? "active" : ""}`}
                      onClick={() => setTimeRange(range)}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Gross Revenue</span>
                    <div className="metric-icon purple"><DollarSign size={18} /></div>
                  </div>
                  <div className="metric-body">
                    <span className="metric-value">$32,100.00</span>
                    <span className="metric-badge positive"><TrendingUp size={12} /> +14.2%</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Total Orders</span>
                    <div className="metric-icon blue"><ShoppingBag size={18} /></div>
                  </div>
                  <div className="metric-body">
                    <span className="metric-value">343</span>
                    <span className="metric-badge positive"><TrendingUp size={12} /> +8.1%</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Active Staff</span>
                    <div className="metric-icon pink"><Users size={18} /></div>
                  </div>
                  <div className="metric-body">
                    <span className="metric-value">12 / 15</span>
                    <span className="metric-badge neutral">80% On Duty</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Low Stock Alert</span>
                    <div className="metric-icon teal"><Package size={18} /></div>
                  </div>
                  <div className="metric-body">
                    <span className="metric-value">7 Items</span>
                    <span className="metric-badge negative"><TrendingDown size={12} /> Action Req.</span>
                  </div>
                </div>
              </div>

              {/* Charts Visualizations Area */}
              <div className="charts-grid">
                {/* Revenue & Sales Flow Area Chart */}
                <div className="chart-card flex-2">
                  <div className="chart-header">
                    <h3>Revenue & Velocity Trend</h3>
                    <span className="chart-legend"><span className="dot purple"></span> Sales ($)</span>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                          itemStyle={{ color: "#f8fafc" }}
                        />
                        <Area type="monotone" dataKey="sales" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sales Share Donut Chart */}
                <div className="chart-card flex-1">
                  <div className="chart-header">
                    <h3>Stock Distribution</h3>
                  </div>
                  <div className="chart-container center">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                      {categoryData.map((cat) => (
                        <div key={cat.name} className="legend-item">
                          <span className="legend-dot" style={{ backgroundColor: cat.color }}></span>
                          <span className="legend-name">{cat.name}</span>
                          <span className="legend-value">{cat.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Retail Transactions Table */}
              <div className="table-card">
                <div className="chart-header">
                  <h3>Recent Register Activity</h3>
                </div>
                <table className="retail-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Purchased Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-mono">{order.id}</td>
                        <td>{order.items}</td>
                        <td className="font-bold">{order.total}</td>
                        <td>
                          <span className={`status-pill ${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="text-muted">{order.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </section>
      </main>
    </div>
  );
}