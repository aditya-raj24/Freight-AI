import React, { useEffect, useState } from "react";

import { API_BASE } from "../config";

function Operations() {
  const [subTab, setSubTab] = useState("bookings"); // "bookings", "wagons", "congestion"
  const [bookings, setBookings] = useState([]);
  const [wagons, setWagons] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedBookingRec, setSelectedBookingRec] = useState(null);
  const [recDetails, setRecDetails] = useState(null);
  const [alertShortage, setAlertShortage] = useState(null);
  const [loading, setLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings`, { headers });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) { console.error(err); }
  };

  const fetchWagons = async () => {
    try {
      const res = await fetch(`${API_BASE}/wagons`, { headers });
      const data = await res.json();
      setWagons(data);
    } catch (err) { console.error(err); }
  };

  const fetchStations = async () => {
    try {
      const res = await fetch(`${API_BASE}/stations`, { headers });
      const data = await res.json();
      setStations(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchBookings();
    fetchWagons();
    fetchStations();
  }, [subTab]);

  // PROGRESS BOOKING STATUS
  const handleUpdateStatus = async (bookingId, nextStatus) => {
    try {
      await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ bookingStatus: nextStatus })
      });
      fetchBookings();
    } catch (err) { console.error(err); }
  };

  // AI RECOMMENDATION CALL
  const handleGetRecommendation = async (booking) => {
    setSelectedBookingRec(booking);
    setRecDetails(null);
    setAlertShortage(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wagons/recommendation?bookingId=${booking.bookingId}`, { headers });
      const data = await res.json();
      setRecDetails(data);
      if (data.shortage) {
        setAlertShortage("Wagon Shortage Alert: Not enough available wagons of specific type to cover the total weight.");
      }
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  // ALLOCATE RECOMMENDED WAGONS
  const handleAllocateRecommended = async () => {
    if (!selectedBookingRec || !recDetails) return;
    try {
      const wagonNums = recDetails.recommendedWagons.map(w => w.wagonNumber);
      const res = await fetch(`${API_BASE}/wagons/allocate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingId: selectedBookingRec.bookingId,
          wagonNumbers: wagonNums
        })
      });
      if (res.ok) {
        setSelectedBookingRec(null);
        setRecDetails(null);
        fetchBookings();
        fetchWagons();
      }
    } catch (err) { console.error(err); }
  };

  // RELEASE WAGONS
  const handleReleaseWagons = async (wagonNumber, station) => {
    try {
      await fetch(`${API_BASE}/wagons/release`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          wagonNumbers: [wagonNumber],
          stationCode: station
        })
      });
      fetchWagons();
    } catch (err) { console.error(err); }
  };

  // UPDATE STATION METRICS (SLIDERS)
  const handleStationSlider = async (stationCode, field, value) => {
    try {
      const updateData = { [field]: Number(value) };
      await fetch(`${API_BASE}/stations/${stationCode}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData)
      });
      // Update local state smoothly without full reload
      setStations(prev => prev.map(s => s.stationCode === stationCode ? { ...s, ...updateData } : s));
    } catch (err) { console.error(err); }
  };

  // Helper for workflow status badges
  const workflowStages = [
    "Draft",
    "Submitted",
    "Under Review",
    "Approved",
    "Wagon Allocated",
    "Train Scheduled",
    "In Transit",
    "Delivered"
  ];

  const getNextStage = (curr) => {
    const idx = workflowStages.indexOf(curr);
    if (idx !== -1 && idx < workflowStages.length - 1) return workflowStages[idx + 1];
    return null;
  };

  const getStationRiskColor = (congestion) => {
    if (congestion > 80) return "danger"; // Red
    if (congestion > 60) return "warning"; // Orange/Yellow
    return "success"; // Green
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Sub Tabs */}
      <div className="glass-card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button className={`btn-secondary ${subTab === "bookings" ? "btn-primary" : ""}`} onClick={() => setSubTab("bookings")}>Booking Management</button>
        <button className={`btn-secondary ${subTab === "wagons" ? "btn-primary" : ""}`} onClick={() => setSubTab("wagons")}>Wagon Siding Allocation</button>
        <button className={`btn-secondary ${subTab === "congestion" ? "btn-primary" : ""}`} onClick={() => setSubTab("congestion")}>Station Congestion Monitor</button>
      </div>

      {/* ==================== BOOKING WORKFLOW PROGRESSION ==================== */}
      {subTab === "bookings" && (
        <div className="glass-card">
          <div className="card-title">Freight Bookings Pipeline</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Cargo Details</th>
                  <th>Priority</th>
                  <th>Pipeline Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const nextStage = getNextStage(b.bookingStatus);
                  return (
                    <tr key={b.bookingId}>
                      <td><b>{b.bookingId}</b></td>
                      <td>{b.customerId?.name || "Customer"}</td>
                      <td>{b.sourceStation} ➔ {b.destinationStation}</td>
                      <td>{b.cargoType} ({b.weight}t | {b.wagonCount} wagons)</td>
                      <td><span className={`badge badge-${b.priority === "Critical" ? "danger" : b.priority === "High" ? "warning" : "info"}`}>{b.priority}</span></td>
                      <td>
                        <span className={`badge badge-${b.bookingStatus === "Delivered" ? "success" : b.bookingStatus === "Submitted" ? "muted" : "info"}`}>
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td>
                        {b.bookingStatus === "Approved" && (
                          <button className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => handleGetRecommendation(b)}>
                            Allocate Wagons (AI)
                          </button>
                        )}
                        {b.bookingStatus !== "Approved" && nextStage && (
                          <button className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => handleUpdateStatus(b.bookingId, nextStage)}>
                            Advance: {nextStage}
                          </button>
                        )}
                        {b.bookingStatus === "Delivered" && (
                          <span style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: "bold" }}>Delivered</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== WAGON SIDING LIST & RELEASE ==================== */}
      {subTab === "wagons" && (
        <div className="glass-card">
          <div className="card-title">Yard Wagons Siding Status</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Wagon Number</th>
                  <th>Wagon Type</th>
                  <th>Capacity Load</th>
                  <th>Siding Station</th>
                  <th>Fleet Status</th>
                  <th>Operational Action</th>
                </tr>
              </thead>
              <tbody>
                {wagons.map((w) => (
                  <tr key={w.wagonNumber}>
                    <td><b>{w.wagonNumber}</b></td>
                    <td>{w.wagonType}</td>
                    <td>{w.capacity} Tons</td>
                    <td>{w.currentStation}</td>
                    <td><span className={`badge badge-${w.status === "Available" ? "success" : w.status === "Allocated" ? "info" : "warning"}`}>{w.status}</span></td>
                    <td>
                      {w.status === "Allocated" && (
                        <button className="btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }} onClick={() => handleReleaseWagons(w.wagonNumber, w.currentStation)}>
                          Release Wagon
                        </button>
                      )}
                      {w.status === "Available" && <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Siding Idle</span>}
                      {w.status === "Maintenance" && <span style={{ color: "var(--warning)", fontSize: "0.8rem" }}>Repairs</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== STATION CONGESTION MONITORS WITH ADJUSTERS ==================== */}
      {subTab === "congestion" && (
        <div className="glass-card">
          <div className="card-title">Live Siding Congestion Monitor</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Station Name</th>
                  <th>Station Code</th>
                  <th>Congestion Index</th>
                  <th>Available Tracks</th>
                  <th>Waiting Trains</th>
                  <th>Operational Risk</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((s) => (
                  <tr key={s.stationCode}>
                    <td><b>{s.stationName}</b></td>
                    <td>{s.stationCode}</td>
                    <td style={{ width: "250px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={s.congestionLevel}
                          onChange={(e) => handleStationSlider(s.stationCode, "congestionLevel", e.target.value)}
                          style={{ margin: 0 }}
                        />
                        <span style={{ minWidth: "35px", textAlign: "right" }}>{s.congestionLevel}%</span>
                      </div>
                    </td>
                    <td style={{ width: "120px" }}>
                      <select
                        value={s.availableTracks}
                        onChange={(e) => handleStationSlider(s.stationCode, "availableTracks", e.target.value)}
                        style={{ padding: "0.3rem" }}
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map(t => <option key={t} value={t}>{t} tracks</option>)}
                      </select>
                    </td>
                    <td style={{ width: "120px" }}>
                      <input
                        type="number"
                        min="0"
                        value={s.waitingTrains}
                        onChange={(e) => handleStationSlider(s.stationCode, "waitingTrains", e.target.value)}
                        style={{ padding: "0.3rem", width: "70px" }}
                      />
                    </td>
                    <td>
                      <span className={`badge badge-${getStationRiskColor(s.congestionLevel)}`}>
                        {s.congestionLevel > 80 ? "Critical (Red)" : s.congestionLevel > 50 ? "Medium (Yellow)" : "Low (Green)"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== AI WAGON RECOMMENDATION POPUP ==================== */}
      {selectedBookingRec && (
        <div className="receipt-overlay">
          <div className="glass-card" style={{ maxWidth: "550px", width: "100%", background: "var(--bg-sidebar)" }}>
            <div className="card-title" style={{ justifyContent: "space-between", display: "flex" }}>
              <span>🤖 AI Wagon Recommendation</span>
              <span style={{ cursor: "pointer", color: "var(--danger)" }} onClick={() => setSelectedBookingRec(null)}>✕</span>
            </div>

            {loading || !recDetails ? (
              <div style={{ textAlign: "center", padding: "2rem" }}><span className="loader"></span></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {alertShortage && (
                  <div className="badge badge-danger" style={{ width: "100%", padding: "0.75rem", display: "block" }}>{alertShortage}</div>
                )}
                
                <div>
                  <div style={{ marginBottom: "0.5rem" }}>Booking ID: <b>{selectedBookingRec.bookingId}</b></div>
                  <div style={{ marginBottom: "0.5rem" }}>Route: <b>{selectedBookingRec.sourceStation} ➔ {selectedBookingRec.destinationStation}</b></div>
                  <div style={{ marginBottom: "0.5rem" }}>Cargo Type: <b>{recDetails.cargoType}</b></div>
                  <div style={{ marginBottom: "0.5rem" }}>Required Weight: <b>{recDetails.requiredWeight} Tons</b></div>
                  <div style={{ marginBottom: "0.5rem" }}>Suggested Capacity: <b>{recDetails.suggestedCapacity} Tons</b></div>
                  <div style={{ marginBottom: "0.5rem" }}>Recommended Wagon Class: <span className="badge badge-info">{recDetails.recommendedType}</span></div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>Suggested Wagon Fleet:</div>
                  <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {recDetails.recommendedWagons.map(w => (
                      <div key={w.wagonNumber} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "0.5rem", borderRadius: "6px" }}>
                        <span><b>{w.wagonNumber}</b> ({w.wagonType})</span>
                        <span style={{ color: w.isAtSource ? "var(--success)" : "var(--text-secondary)" }}>
                          Station: {w.currentStation} {w.isAtSource && "(Siding Match)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                  <button className="btn-secondary" onClick={() => setSelectedBookingRec(null)}>Cancel</button>
                  <button className="btn-primary" onClick={handleAllocateRecommended} disabled={recDetails.recommendedWagons.length === 0}>
                    Allocate Recommended Stock
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Operations;
