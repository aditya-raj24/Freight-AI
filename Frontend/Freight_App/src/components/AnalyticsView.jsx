import React, { useEffect, useState } from "react";

import { API_BASE } from "../config";

// ==========================================
// CUSTOM SVG AREA CHART (Freight Volume)
// ==========================================
function SVGAreaChart({ data }) {
  if (!data || data.length === 0) return null;
  const width = 500;
  const height = 200;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const maxVal = Math.max(...data.map(d => d.volume)) * 1.1;
  const minVal = 0;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / (data.length - 1);
    const y = height - paddingBottom - ((d.volume - minVal) * (height - paddingTop - paddingBottom)) / (maxVal - minVal);
    return { x, y };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // Area path (closes at the bottom)
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
        return (
          <line key={i} x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--border-color)" strokeWidth="1" />
        );
      })}

      {/* Area and Line */}
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#a855f7" stroke="white" strokeWidth="1.5" />
      ))}

      {/* Axes */}
      <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="var(--border-color)" strokeWidth="1.5" />
      <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="var(--border-color)" strokeWidth="1.5" />

      {/* X Labels */}
      {data.map((d, i) => {
        const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / (data.length - 1);
        return (
          <text key={i} x={x} y={height - 10} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">
            {d.month}
          </text>
        );
      })}

      {/* Y Labels */}
      {[0, 0.5, 1].map((ratio, i) => {
        const val = Math.round(maxVal - ratio * maxVal);
        const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
        return (
          <text key={i} x={paddingLeft - 8} y={y + 3} fill="var(--text-secondary)" fontSize="9" textAnchor="end">
            {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
          </text>
        );
      })}
    </svg>
  );
}

// ==========================================
// CUSTOM SVG LINE CHART (Daily Bookings)
// ==========================================
function SVGLineChart({ data, dataKey, color }) {
  if (!data || data.length === 0) return null;
  const width = 500;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const maxVal = Math.max(...data.map(d => d[dataKey])) * 1.1 || 10;
  const minVal = 0;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / (data.length - 1);
    const y = height - paddingBottom - ((d[dataKey] - minVal) * (height - paddingTop - paddingBottom)) / (maxVal - minVal);
    return { x, y };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
        return (
          <line key={i} x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--border-color)" strokeWidth="1" />
        );
      })}

      {/* Path line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="3" />

      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill="var(--bg-color)" stroke={color} strokeWidth="2.5" />
      ))}

      {/* Axes */}
      <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="var(--border-color)" strokeWidth="1.5" />
      <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="var(--border-color)" strokeWidth="1.5" />

      {/* X Labels */}
      {data.map((d, i) => {
        const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / (data.length - 1);
        return (
          <text key={i} x={x} y={height - 10} fill="var(--text-secondary)" fontSize="8" textAnchor="middle">
            {d.date}
          </text>
        );
      })}

      {/* Y Labels */}
      {[0, 0.5, 1].map((ratio, i) => {
        const val = Math.round(maxVal - ratio * maxVal);
        const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
        return (
          <text key={i} x={paddingLeft - 8} y={y + 3} fill="var(--text-secondary)" fontSize="9" textAnchor="end">
            {val}
          </text>
        );
      })}
    </svg>
  );
}

// ==========================================
// CUSTOM SVG DONUT CHART (Wagon Status)
// ==========================================
function SVGDonutChart({ data, colors }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  
  let accumulatedAngle = 0;
  const radius = 50;
  const cx = 80;
  const cy = 80;

  return (
    <svg viewBox="0 0 160 160" width="100%" height="100%">
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
            strokeWidth="18"
            strokeDasharray={strokeDasharray}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}
      
      <circle cx={cx} cy={cy} r="38" fill="var(--gauge-inner-bg)" />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="bold">
        Total: {total}
      </text>
    </svg>
  );
}

// ==========================================
// MAIN ANALYTICS VIEW
// ==========================================
const COLORS = ["#10b981", "#4f46e5", "#ef4444", "#f59e0b"];

function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportToCSV = () => {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Category,Parameter,Value\n";
    
    Object.entries(data.kpis).forEach(([key, val]) => {
      csvContent += `KPI,${key},${val}\n`;
    });
    
    data.charts.dailyBookings.forEach((item) => {
      csvContent += `Daily Bookings,${item.date},${item.bookings}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FreightLink_Analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (!data) return;
    let excelContent = "<table><tr><th>Metric Category</th><th>Parameter</th><th>Value</th></tr>";
    Object.entries(data.kpis).forEach(([key, val]) => {
      excelContent += `<tr><td>KPI</td><td>${key}</td><td>${val}</td></tr>`;
    });
    excelContent += "</table>";
    
    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FreightLink_Report_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "3rem" }}>
        <span className="loader"></span>
        <p style={{ marginTop: "1rem" }}>Gathering logistics analytics and telemetry...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "2rem" }}>
        <div className="badge badge-danger">Failed to load analytics data.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="no-print">
      {/* Exporter Controls */}
      <div className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>📊 Operations & Scheduling Analytics</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Real-time visual reports representing wagon siding capacity, wait trends, and delays.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-secondary" onClick={exportToCSV}>Export CSV</button>
          <button className="btn-secondary" onClick={exportToExcel}>Export Excel</button>
          <button className="btn-primary" onClick={() => window.print()}>Print PDF Report</button>
        </div>
      </div>

      {/* Grid of Custom SVG Charts */}
      <div className="analytics-grid">
        
        {/* Chart 1: Monthly Freight Volume */}
        <div className="glass-card">
          <div className="card-title">Freight Volume Distribution (Tons)</div>
          <div style={{ width: "100%", height: 220, marginTop: "1rem" }}>
            <SVGAreaChart data={data.charts.monthlyVolume} />
          </div>
        </div>

        {/* Chart 2: Daily Bookings */}
        <div className="glass-card">
          <div className="card-title">Daily Booking Volume (Weekly Trend)</div>
          <div style={{ width: "100%", height: 220, marginTop: "1rem" }}>
            <SVGLineChart data={data.charts.dailyBookings} dataKey="bookings" color="#8b5cf6" />
          </div>
        </div>

        {/* Chart 3: Wagon Utilization Pie */}
        <div className="glass-card">
          <div className="card-title">Wagon Fleet Status & Allocation</div>
          <div className="analytics-donut-container">
            <div style={{ width: "45%", height: "100%" }}>
              <SVGDonutChart data={data.charts.wagonUtilization} colors={COLORS} />
            </div>
            <div style={{ width: "55%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {data.charts.wagonUtilization.map((w, idx) => (
                <div key={w.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "3px", backgroundColor: COLORS[idx] }}></div>
                  <span style={{ fontSize: "0.9rem" }}>{w.name}: <b>{w.value}</b> wagons</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Station Congestion index */}
        <div className="glass-card">
          <div className="card-title">Station Congestion Index (%)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            {data.charts.stationCongestion.map((item) => (
              <div key={item.station}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                  <span><b>{item.station}</b> (Tracks: {item.tracks} | Waiting: {item.waiting})</span>
                  <span><b>{item.congestion}%</b></span>
                </div>
                <div style={{ height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                  <div 
                    style={{ 
                      width: `${item.congestion}%`, 
                      height: "100%", 
                      background: item.congestion > 75 ? "var(--danger)" : item.congestion > 50 ? "var(--warning)" : "var(--success)", 
                      borderRadius: "4px",
                      transition: "width 0.5s ease"
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 5: Delay Trends */}
        <div className="glass-card">
          <div className="card-title">Average Route Delay (Hours)</div>
          <div style={{ width: "100%", height: 220, marginTop: "1rem" }}>
            <SVGLineChart data={data.charts.delayTrends} dataKey="avgDelay" color="#10b981" />
          </div>
        </div>

        {/* Chart 6: Top Routes */}
        <div className="glass-card">
          <div className="card-title">Top Revenue Freight Corridors</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "1rem" }}>
            {data.charts.topRoutes.map((item) => (
              <div key={item.route} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span>{item.route}</span>
                  <span>{item.volume.toLocaleString()} tons ({item.trips} trips)</span>
                </div>
                <div style={{ height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                  <div 
                    style={{ 
                      width: `${(item.volume / 20000) * 100}%`, 
                      height: "100%", 
                      background: "linear-gradient(90deg, var(--primary), var(--accent))", 
                      borderRadius: "4px" 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AnalyticsView;
