import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
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
  DollarSign,
  ShoppingBag,
  TrendingDown,
  RefreshCw,
  Receipt,
} from "lucide-react";

const CATEGORY_COLORS = ["#a855f7", "#6366f1", "#ec4899", "#14b8a6", "#f59e0b"];

export default function DashboardHome() {
  const [timeRange, setTimeRange] = useState("Today"); // "Today" | "Weekly" | "Monthly"
  const [loading, setLoading] = useState(true);

  // API State
  const [summaryData, setSummaryData] = useState({
    total_revenue: 0,
    total_cost: 0,
    net_profit: 0,
    count: 0,
    data: [],
  });
  const [recentOrders, setRecentOrders] = useState([]);

  const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const getAuthToken = () => localStorage.getItem("authToken");

  // Map tab name to controller period query param
  const getPeriodParam = (range) => {
    switch (range) {
      case "Today":
        return "today";
      case "Weekly":
        return "this_week";
      case "Monthly":
        return "this_month";
      default:
        return "today";
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, [timeRange]);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const period = getPeriodParam(timeRange);

      // Fetch financial summary and recent orders in parallel
      const [summaryRes, ordersRes] = await Promise.all([
        fetch(`${SERVER_BASE_URL}/api/admin/reports/summary?period=${period}`, { headers }),
        fetch(`${SERVER_BASE_URL}/api/admin/orders`, { headers }),
      ]);

      const summaryResult = await summaryRes.json();
      const ordersResult = await ordersRes.json();

      if (summaryRes.ok && summaryResult.status === "success") {
        setSummaryData({
          total_revenue: summaryResult.total_revenue || 0,
          total_cost: summaryResult.total_cost || 0,
          net_profit: summaryResult.net_profit || 0,
          count: summaryResult.count || 0,
          data: summaryResult.data || [],
        });
      }

      if (ordersRes.ok && ordersResult.status === "success") {
        const orderList = Array.isArray(ordersResult.data)
          ? ordersResult.data
          : ordersResult.data?.data || [];
        setRecentOrders(orderList.slice(0, 5)); // Take latest 5 orders
      }
    } catch (error) {
      console.error("Failed to load dashboard telemetry:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamically group ledger entries for Area Chart timeline
  const chartTimelineData = useMemo(() => {
    if (!summaryData.data || summaryData.data.length === 0) return [];

    const timelineMap = {};

    summaryData.data.forEach((item) => {
      const date = new Date(item.created_at);
      const timeKey =
        timeRange === "Today"
          ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : date.toLocaleDateString([], { month: "short", day: "numeric" });

      if (!timelineMap[timeKey]) {
        timelineMap[timeKey] = { time: timeKey, revenue: 0, cost: 0 };
      }

      const amt = parseFloat(item.amount || 0);
      if (item.type === "revenue") timelineMap[timeKey].revenue += amt;
      if (item.type === "cost") timelineMap[timeKey].cost += amt;
    });

    return Object.values(timelineMap);
  }, [summaryData, timeRange]);

  // Dynamically break down ledger transactions by category for Pie Chart
  const categoryBreakdown = useMemo(() => {
    if (!summaryData.data || summaryData.data.length === 0) return [];

    const catMap = {};
    let totalAmt = 0;

    summaryData.data.forEach((item) => {
      const categoryName = item.category || "General";
      const amt = parseFloat(item.amount || 0);

      catMap[categoryName] = (catMap[categoryName] || 0) + amt;
      totalAmt += amt;
    });

    return Object.keys(catMap).map((cat, idx) => ({
      name: cat.replace("_", " ").toUpperCase(),
      value: totalAmt > 0 ? Math.round((catMap[cat] / totalAmt) * 100) : 0,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));
  }, [summaryData]);

  return (
    <div className="analytics-view">
      {/* Top Bar Header */}
      <div className="analytics-header">
        <div>
          <h2 className="dashboard-heading">Retail Operations Hub</h2>
          <p className="dashboard-subheading">Real-time revenue, cost & ledger metrics.</p>
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
          <button className="btn-refresh" onClick={fetchDashboardMetrics} title="Refresh Telemetry">
            <RefreshCw size={14} className={loading ? "spin" : ""} />
          </button>
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
            <span className="metric-value">${summaryData.total_revenue.toFixed(2)}</span>
            <span className="metric-badge positive"><TrendingUp size={12} /> Live</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Cost</span>
            <div className="metric-icon blue"><Receipt size={18} /></div>
          </div>
          <div className="metric-body">
            <span className="metric-value">${summaryData.total_cost.toFixed(2)}</span>
            <span className="metric-badge negative"><TrendingDown size={12} /> Expense</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Net Profit</span>
            <div className="metric-icon pink"><DollarSign size={18} /></div>
          </div>
          <div className="metric-body">
            <span className={`metric-value ${summaryData.net_profit >= 0 ? "text-accent" : "text-danger"}`}>
              ${summaryData.net_profit.toFixed(2)}
            </span>
            <span className={`metric-badge ${summaryData.net_profit >= 0 ? "positive" : "negative"}`}>
              {summaryData.net_profit >= 0 ? "Profitable" : "Deficit"}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Report Entries</span>
            <div className="metric-icon teal"><ShoppingBag size={18} /></div>
          </div>
          <div className="metric-body">
            <span className="metric-value">{summaryData.count}</span>
            <span className="metric-badge neutral">Transactions</span>
          </div>
        </div>
      </div>

      {/* Charts Visualizations Area */}
      <div className="charts-grid">
        {/* Revenue & Cost Flow Area Chart */}
        <div className="chart-card flex-2">
          <div className="chart-header">
            <h3>Financial Flow Trend</h3>
            <span className="chart-legend">
              <span className="dot purple"></span> Revenue ($)
            </span>
          </div>
          <div className="chart-container">
            {chartTimelineData.length === 0 ? (
              <div className="empty-chart">No ledger activity recorded for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Ledger Share Donut Chart */}
        <div className="chart-card flex-1">
          <div className="chart-header">
            <h3>Category Breakdown</h3>
          </div>
          <div className="chart-container center">
            {categoryBreakdown.length === 0 ? (
              <div className="empty-chart">No categories recorded.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryBreakdown} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: cat.color }}></span>
                      <span className="legend-name">{cat.name}</span>
                      <span className="legend-value">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="table-card">
        <div className="chart-header">
          <h3>Recent Orders Activity</h3>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty-state"><p>No recent orders found.</p></div>
        ) : (
          <table className="retail-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono">{order.order_number || `#ORD-${order.id}`}</td>
                  <td>{order.total_quantity} pcs</td>
                  <td className="font-bold">${parseFloat(order.total_price || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-pill ${order.order_status || "pending"}`}>
                      {(order.order_status || "pending").toUpperCase()}
                    </span>
                  </td>
                  <td className="text-muted">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}