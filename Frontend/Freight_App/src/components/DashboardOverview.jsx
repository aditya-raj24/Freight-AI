import React, { useEffect, useState } from "react";

import { API_BASE } from "../config";
const COLORS = ["#10b981", "#4f46e5", "#ef4444", "#f59e0b"];

// ==========================================
// CUSTOM SVG DONUT CHART (Wagon Status)
// ==========================================
function SVGDonutChart({ data, colors }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  
  let accumulatedAngle = 0;
  const radius = 35;
  const cx = 50;
  const cy = 50;

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {data.map((d, i) => {
        const percentage = d.value / total;
        const angle = percentage * 360;
        
        // Circular dash arrays
        const circumference = 2 * Math.PI * radius;
        const strokeDasharray = `${(percentage * circumference).toFixed(1)} ${(circumference - percentage * circumference).toFixed(1)}`;
        const rotation = accumulatedAngle - 90; // Start at 12 o'clock
        
        accumulatedAngle += angle;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth="10"
            strokeDasharray={strokeDasharray}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}
      
      <circle cx={cx} cy={cy} r={28} fill="var(--gauge-inner-bg)" />
      <text x={cx} y={cy + 3} textAnchor="middle" fill="var(--text-primary)" fontSize="8" fontWeight="bold">
        {total} total
      </text>
    </svg>
  );
}

function DashboardOverview({ onNavigate, user }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch KPIs
        const analyticsRes = await fetch(`${API_BASE}/analytics`, { headers });
        const analyticsData = await analyticsRes.json();
        setStats(analyticsData);

        // Fetch Audit Logs (Officer only fallback, otherwise mock / empty)
        const logsRes = await fetch(`${API_BASE}/analytics/audit-logs`, { headers });
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData.slice(0, 5));
        } else {
          setLogs([
            { timestamp: new Date(), action: "AI Route Optimization check performed", user: "Control Room" },
            { timestamp: new Date(Date.now() - 3600000), action: "Booking BK1002 status updated to 'Approved'", user: "Officer" }
          ]);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "3rem" }}>
        <span className="loader"></span>
        <p style={{ marginTop: "1rem" }}>Gathering operations metrics...</p>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    totalBookings: 0,
    pendingBookings: 0,
    activeTrains: 0,
    availableWagons: 0,
    totalWagons: 0,
    delayedTrains: 0,
    highCongestionStations: 0
  };

  const utilization = stats?.charts?.wagonUtilization || [
    { name: "Available", value: 1 },
    { name: "Allocated", value: 0 },
    { name: "Maintenance", value: 0 }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* KPI Section */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div className="kpi-header">
            <span className="kpi-title">Total Freight Bookings</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: "rgba(79, 70, 229, 0.15)", color: "var(--primary)" }}>📋</div>
          </div>
          <span className="kpi-value">{kpis.totalBookings}</span>
          <span className="kpi-trend" style={{ color: "var(--text-secondary)" }}>Lifetime bookings pipeline</span>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid var(--warning)" }}>
          <div className="kpi-header">
            <span className="kpi-title">Pending Approvals</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "var(--warning)" }}>⏳</div>
          </div>
          <span className="kpi-value">{kpis.pendingBookings}</span>
          <span className="kpi-trend" style={{ color: "var(--warning)" }}>Requires officer review</span>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid var(--success)" }}>
          <div className="kpi-header">
            <span className="kpi-title">Dispatched (Transit)</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>🚆</div>
          </div>
          <span className="kpi-value">{kpis.activeTrains}</span>
          <span className="kpi-trend" style={{ color: "var(--success)" }}>Actively moving on tracks</span>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid var(--danger)" }}>
          <div className="kpi-header">
            <span className="kpi-title">Delayed Trains</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--danger)" }}>⚠️</div>
          </div>
          <span className="kpi-value">{kpis.delayedTrains}</span>
          <span className="kpi-trend" style={{ color: "var(--danger)" }}>AI risk delays &gt; 12 hours</span>
        </div>
      </div>

      <div className="dashboard-layout-grid">
        
        {/* Recent logs */}
        <div className="glass-card">
          <div className="card-title">Recent Operational Actions</div>
          <div className="dashboard-log-list">
            {logs.map((log, index) => (
              <div key={index} className="dashboard-log-item">
                <div className="dashboard-log-text-group">
                  <div className="dashboard-log-action">{log.action}</div>
                  <div className="dashboard-log-time">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
                <span className="badge badge-muted dashboard-log-badge">{log.user}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Donut Widget */}
        <div className="glass-card yard-status-card">
          <div className="card-title">Yard Fleet Status</div>
          <div className="donut-chart-container">
            <div className="donut-chart-wrapper">
              <SVGDonutChart data={utilization} colors={COLORS} />
            </div>
          </div>
          <div className="donut-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: COLORS[0] }}></div>
              <span>Free</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: COLORS[1] }}></div>
              <span>Allocated</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: COLORS[2] }}></div>
              <span>Repairs</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid of quick actions */}
      <div className="glass-card">
        <div className="card-title">Quick Tasks Links</div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={() => onNavigate("ai")}>AI Delay Prediction</button>
          <button className="btn-secondary" onClick={() => onNavigate("booking")}>Book Freight</button>
          <button className="btn-secondary" onClick={() => onNavigate("tracking")}>Track Dispatches</button>
          {user?.role === "officer" && (
            <button className="btn-secondary" onClick={() => onNavigate("analytics")}>Analytics Sheet</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
