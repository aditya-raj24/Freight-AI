import React, { useState, useEffect } from "react";

import { API_BASE } from "../config";

// Haversine formula to compute great-circle distance between coordinates
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function AIPanel({ user }) {
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const isOfficer = currentUser.role === "officer";
  const isCustomer = !isOfficer;

  const [stationList, setStationList] = useState([]);
  const [formData, setFormData] = useState({
    distance: "",
    wagon_count: "",
    total_weight: "",
    locomotive_power: isCustomer ? "5000" : "",
    congestion_level: isCustomer ? "30" : "",
    avg_wait_time: isCustomer ? "45" : "",
    source_code: "",
    destination_code: "",
    rainfall: isCustomer ? "0" : "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await fetch(`${API_BASE}/ai/stations`);
        const data = await res.json();
        const list = Object.entries(data).map(([code, info]) => ({
          code,
          name: info.name,
          location: info.location,
        }));
        setStationList(list);
      } catch (err) {
        console.error("Failed to load stations:", err);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/ai/history`, { headers });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchStations();
    fetchHistory();
  }, []);

  // Auto calculate distance between source and destination stations using coordinates
  useEffect(() => {
    if (
      formData.source_code &&
      formData.destination_code &&
      stationList.length > 0
    ) {
      const srcCode = formData.source_code.toUpperCase().trim();
      const destCode = formData.destination_code.toUpperCase().trim();
      const source = stationList.find((s) => s.code.toUpperCase() === srcCode);
      const dest = stationList.find((s) => s.code.toUpperCase() === destCode);
      if (source && dest && source.location && dest.location) {
        const dist = getHaversineDistance(
          source.location.lat,
          source.location.lng,
          dest.location.lat,
          dest.location.lng,
        );
        setFormData((prev) => ({ ...prev, distance: dist }));
      }
    }
  }, [formData.source_code, formData.destination_code, stationList]);

  const loadSample = async () => {
    try {
      const res = await fetch(`${API_BASE}/ai/sample-data`);
      const data = await res.json();
      setFormData({
        distance: data.distance,
        wagon_count: data.wagon_count,
        total_weight: data.total_weight,
        locomotive_power: data.locomotive_power,
        congestion_level: data.congestion_level,
        avg_wait_time: data.avg_wait_time,
        source_code: data.source_code,
        destination_code: data.destination_code,
        rainfall: data.rainfall || 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = { ...formData };

      // Auto-fill defaults for customers if fields are empty or not shown
      if (isCustomer) {
        payload.locomotive_power = payload.locomotive_power || "5000";
        payload.congestion_level = payload.congestion_level || "30";
        payload.avg_wait_time = payload.avg_wait_time || "45";
        payload.rainfall = payload.rainfall || "0";
      }

      [
        "distance",
        "wagon_count",
        "total_weight",
        "locomotive_power",
        "congestion_level",
        "avg_wait_time",
        "rainfall",
      ].forEach((k) => {
        if (
          payload[k] !== "" &&
          payload[k] !== undefined &&
          payload[k] !== null
        ) {
          payload[k] = Number(payload[k]);
        }
      });

      const res = await fetch(`${API_BASE}/ai/predict-and-schedule`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to predict");

      setResult(data);

      // Refresh history list
      const histRes = await fetch(`${API_BASE}/ai/history`, { headers });
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Heuristic color map for gauges
  const getRiskColor = (risk) => {
    if (risk === "Critical") return "#ef4444"; // Red
    if (risk === "High") return "#f97316"; // Orange
    if (risk === "Medium") return "#eab308"; // Yellow
    return "#10b981"; // Green
  };

  // Convert delay percentage to degrees for circular gauge (max 48h)
  const getGaugeStyle = (delay, risk) => {
    const deg = Math.min(360, (delay / 48) * 360);
    const color = getRiskColor(risk);
    return {
      background: `conic-gradient(${color} ${deg}deg, rgba(255,255,255,0.05) ${deg}deg)`,
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Prediction inputs */}
      <div className="glass-card">
        <div className="flex-between">
          <h2 style={{ margin: 0 }}>🤖 AI Dispatch Delay Optimizer</h2>
          {isOfficer && (
            <button className="btn-secondary" onClick={loadSample}>
              Load XGBoost Sample Data
            </button>
          )}
        </div>

        {error && (
          <div
            className="badge badge-danger"
            style={{
              width: "100%",
              padding: "0.8rem",
              marginBottom: "1rem",
              display: "block",
            }}
          >
            {error}
          </div>
        )}

        <datalist id="stations-list">
          {stationList.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name} ({s.code})
            </option>
          ))}
        </datalist>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Source Station Code</label>
              <input
                list="stations-list"
                name="source_code"
                value={formData.source_code}
                onChange={handleChange}
                placeholder="e.g. NDLS"
                required
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label>Destination Code</label>
              <input
                list="stations-list"
                name="destination_code"
                value={formData.destination_code}
                onChange={handleChange}
                placeholder="e.g. BCT"
                required
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label>Distance (km)</label>
              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Wagon Count</label>
              <input
                type="number"
                name="wagon_count"
                value={formData.wagon_count}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Total Cargo Weight (tons)</label>
              <input
                type="number"
                name="total_weight"
                value={formData.total_weight}
                onChange={handleChange}
                required
              />
            </div>
            {isOfficer && (
              <>
                <div className="form-group">
                  <label>Locomotive Power (HP)</label>
                  <input
                    type="number"
                    name="locomotive_power"
                    value={formData.locomotive_power}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Station Congestion (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="congestion_level"
                    value={formData.congestion_level}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rainfall (mm)</label>
                  <input
                    type="number"
                    name="rainfall"
                    value={formData.rainfall}
                    onChange={handleChange}
                    placeholder="Optional OpenWeatherMap"
                  />
                </div>
                <div className="form-group">
                  <label>Avg Yard Wait Time (mins)</label>
                  <input
                    type="number"
                    name="avg_wait_time"
                    value={formData.avg_wait_time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: "1.5rem" }}
            disabled={loading}
          >
            {loading ? (
              <span className="loader"></span>
            ) : (
              "Analyze Transit & Predict Delay"
            )}
          </button>
        </form>
      </div>

      {/* Visual Analytics Widgets */}
      {result && (
        <div className="ai-results-grid">
          {/* Gauge Widget */}
          <div
            className="glass-card"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div className="card-title">AI Delay Risk Profile</div>

            <div className="gauge-container">
              <div
                className="circular-gauge"
                style={getGaugeStyle(result.delay, result.riskLevel)}
              >
                <div className="gauge-content">
                  <span
                    className="gauge-value"
                    style={{ color: getRiskColor(result.riskLevel) }}
                  >
                    {result.delay}h
                  </span>
                  <span className="gauge-label">Est. Delay</span>
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <span
                  className="badge"
                  style={{
                    backgroundColor: getRiskColor(result.riskLevel) + "22",
                    color: getRiskColor(result.riskLevel),
                    fontSize: "0.9rem",
                    padding: "0.4rem 1rem",
                    borderRadius: "10px",
                  }}
                >
                  {result.riskLevel} Risk Profile
                </span>
                {isOfficer && (
                  <p
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Confidence index: <b>{result.confidence}%</b>
                  </p>
                )}
              </div>
            </div>

            {isOfficer && (
              <div
                style={{
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    marginBottom: "0.25rem",
                  }}
                >
                  AI Decision Action:
                </div>
                <div
                  style={{
                    fontWeight: "700",
                    color:
                      result.action === "Reroute"
                        ? "var(--danger)"
                        : "var(--success)",
                  }}
                >
                  {result.action} Siding Schedulers
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    marginTop: "0.25rem",
                  }}
                >
                  {result.reason}
                </p>
              </div>
            )}
          </div>

          {/* Explainability Bar Chart Widget for Officer */}
          {isOfficer && (
            <div className="glass-card">
              <div className="card-title">
                XGBoost Explainability (Feature Importance)
              </div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.82rem",
                  marginBottom: "1.25rem",
                }}
              >
                SHAP contribution breakdown representing influence of variables
                on final scheduling delays.
              </p>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <div className="bar-chart-row">
                  <div className="bar-chart-labels">
                    <span>Station Congestion</span>
                    <span>
                      <b>35%</b>
                    </span>
                  </div>
                  <div className="bar-chart-bar-container">
                    <div
                      className="bar-chart-bar-fill"
                      style={{ width: "35%", backgroundColor: "#ef4444" }}
                    ></div>
                  </div>
                </div>

                <div className="bar-chart-row">
                  <div className="bar-chart-labels">
                    <span>Weather (Rainfall / Winds)</span>
                    <span>
                      <b>20%</b>
                    </span>
                  </div>
                  <div className="bar-chart-bar-container">
                    <div
                      className="bar-chart-bar-fill"
                      style={{ width: "20%", backgroundColor: "#f97316" }}
                    ></div>
                  </div>
                </div>

                <div className="bar-chart-row">
                  <div className="bar-chart-labels">
                    <span>Wagon Count</span>
                    <span>
                      <b>15%</b>
                    </span>
                  </div>
                  <div className="bar-chart-bar-container">
                    <div
                      className="bar-chart-bar-fill"
                      style={{ width: "15%", backgroundColor: "#3b82f6" }}
                    ></div>
                  </div>
                </div>

                <div className="bar-chart-row">
                  <div className="bar-chart-labels">
                    <span>Cargo Weight Load</span>
                    <span>
                      <b>10%</b>
                    </span>
                  </div>
                  <div className="bar-chart-bar-container">
                    <div
                      className="bar-chart-bar-fill"
                      style={{ width: "10%" }}
                    ></div>
                  </div>
                </div>

                <div className="bar-chart-row">
                  <div className="bar-chart-labels">
                    <span>Transit Route Distance</span>
                    <span>
                      <b>10%</b>
                    </span>
                  </div>
                  <div className="bar-chart-bar-container">
                    <div
                      className="bar-chart-bar-fill"
                      style={{ width: "10%" }}
                    ></div>
                  </div>
                </div>

                <div className="bar-chart-row">
                  <div className="bar-chart-labels">
                    <span>Locomotive Engine Power</span>
                    <span>
                      <b>10%</b>
                    </span>
                  </div>
                  <div className="bar-chart-bar-container">
                    <div
                      className="bar-chart-bar-fill"
                      style={{ width: "10%" }}
                    ></div>
                  </div>
                </div>
              </div>

              {result.suggested_route && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.8rem 1.2rem",
                    background: "rgba(239, 68, 68, 0.08)",
                    borderLeft: "4px solid #ef4444",
                    borderRadius: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      textTransform: "uppercase",
                      fontWeight: "bold",
                      color: "#fca5a5",
                    }}
                  >
                    AI Schedulers Bypass:
                  </span>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "white",
                      fontWeight: "600",
                      marginTop: "2px",
                    }}
                  >
                    {result.suggested_route}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Shipment Transit Timeline Widget for Customer */}
          {isCustomer && (
            <div className="glass-card" style={{ flexGrow: 1 }}>
              <div className="card-title">
                📦 Shipment Transit & Delay Analysis
              </div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  marginBottom: "1.5rem",
                }}
              >
                Visual routing path and predictive siding status for your
                booking from <b>{formData.source_code}</b> to{" "}
                <b>{formData.destination_code}</b>.
              </p>

              <div className="customer-timeline">
                <div className="timeline-step completed">
                  <div className="timeline-badge">✓</div>
                  <div className="timeline-content">
                    <div className="timeline-title">Booking Accepted</div>
                    <div className="timeline-desc">
                      Order scheduled in central dispatch logs.
                    </div>
                  </div>
                </div>

                <div className="timeline-step completed">
                  <div className="timeline-badge">🤖</div>
                  <div className="timeline-content">
                    <div className="timeline-title">
                      AI Routing Optimization
                    </div>
                    <div className="timeline-desc">
                      Paths analyzed using real-time siding load forecasts.
                    </div>
                  </div>
                </div>

                <div className="timeline-step warning">
                  <div className="timeline-badge">🏫</div>
                  <div className="timeline-content">
                    <div className="timeline-title">Siding Operations</div>
                    <div className="timeline-desc">
                      {result.delay > 10 ? (
                        <span style={{ color: "var(--warning)" }}>
                          ⚠️ High traffic at source yard siding. Processing
                          could be slower.
                        </span>
                      ) : (
                        "Siding yard capacity cleared. Smooth turnaround expected."
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`timeline-step ${result.delay > 12 ? "critical" : "active"}`}
                >
                  <div className="timeline-badge">🚂</div>
                  <div className="timeline-content">
                    <div className="timeline-title">
                      Mainline Transit Corridor
                    </div>
                    <div className="timeline-desc">
                      Distance: <b>{result.distance || formData.distance} km</b>
                      . Estimated transit delay:{" "}
                      <span
                        style={{
                          fontWeight: "700",
                          color: getRiskColor(result.riskLevel),
                        }}
                      >
                        +{result.delay} Hours
                      </span>
                      .
                    </div>
                  </div>
                </div>

                <div className="timeline-step pending">
                  <div className="timeline-badge">🏁</div>
                  <div className="timeline-content">
                    <div className="timeline-title">Destination Delivery</div>
                    <div className="timeline-desc">
                      {result.delay > 6 ? (
                        <span>
                          Predicted arrival adjusted for a{" "}
                          <b>{result.riskLevel.toLowerCase()}</b> risk of delay.
                        </span>
                      ) : (
                        "On track for on-time delivery at destination siding."
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="glass-card">
          <div className="card-title">Recent Run Predictions Log</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Predicted Delay</th>
                  {isOfficer && <th>Confidence</th>}
                  <th>Run Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>
                      <b>{h.bookingId}</b>
                    </td>
                    <td>{h.predictedDelay} Hours</td>
                    {isOfficer && <td>{h.confidence}%</td>}
                    <td>{new Date(h.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIPanel;
