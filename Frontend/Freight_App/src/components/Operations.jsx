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

  // UPDATE BOOKING PRIORITY
  const handleUpdatePriority = async (bookingId, newPriority) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ priority: newPriority })
      });
      if (res.ok) {
        fetchBookings();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update priority");
      }
    } catch (err) {
      console.error("Priority update error:", err);
    }
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
      <div className="glass-card operations-tabs-container">
        <button className={`btn-secondary ${subTab === "bookings" ? "btn-primary" : ""}`} onClick={() => setSubTab("bookings")}>Booking Management</button>
        <button className={`btn-secondary ${subTab === "wagons" ? "btn-primary" : ""}`} onClick={() => setSubTab("wagons")}>Wagon Siding Allocation</button>
        <button className={`btn-secondary ${subTab === "congestion" ? "btn-primary" : ""}`} onClick={() => setSubTab("congestion")}>Station Congestion Monitor</button>
      </div>

      {/* ==================== BOOKING WORKFLOW PROGRESSION ==================== */}
      {subTab === "bookings" && (
        <div className="glass-card">
          <div className="card-title">Freight Bookings Pipeline</div>
          <div className="table-container">
            <table className="responsive-table">
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
                      <td data-label="Booking ID"><b>{b.bookingId}</b></td>
                      <td data-label="Customer">{b.customerId?.name || "Customer"}</td>
                      <td data-label="Route">{b.sourceStation} ➔ {b.destinationStation}</td>
                      <td data-label="Cargo Details">{b.cargoType} ({b.weight}t | {b.wagonCount} wagons)</td>
                      <td data-label="Priority">
                        <select 
                          value={b.priority} 
                          onChange={(e) => handleUpdatePriority(b.bookingId, e.target.value)}
                          style={{ 
                            padding: "0.3rem 0.5rem", 
                            fontSize: "0.82rem", 
                            width: "auto", 
                            minWidth: "105px", 
                            borderRadius: "6px",
                            fontWeight: "600",
                            backgroundColor: "var(--input-bg)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-color)",
                            cursor: "pointer"
                          }}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </td>
                      <td data-label="Pipeline Status">
                        <span className={`badge badge-${b.bookingStatus === "Delivered" ? "success" : b.bookingStatus === "Submitted" ? "muted" : "info"}`}>
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td data-label="Action">
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
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
                          {b.bookingStatus !== "Delivered" && b.bookingStatus !== "Declined" && (
                            <button 
                              className="btn-danger" 
                              style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to decline booking ${b.bookingId}?`)) {
                                  handleUpdateStatus(b.bookingId, "Declined");
                                }
                              }}
                            >
                              Decline
                            </button>
                          )}
                          {b.bookingStatus === "Delivered" && (
                            <span style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: "bold" }}>Delivered</span>
                          )}
                          {b.bookingStatus === "Declined" && (
                            <span style={{ fontSize: "0.8rem", color: "var(--danger)", fontWeight: "bold" }}>Declined</span>
                          )}
                        </div>
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
            <table className="responsive-table">
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
                    <td data-label="Wagon Number"><b>{w.wagonNumber}</b></td>
                    <td data-label="Wagon Type">{w.wagonType}</td>
                    <td data-label="Capacity Load">{w.capacity} Tons</td>
                    <td data-label="Siding Station">{w.currentStation}</td>
                    <td data-label="Fleet Status"><span className={`badge badge-${w.status === "Available" ? "success" : w.status === "Allocated" ? "info" : "warning"}`}>{w.status}</span></td>
                    <td data-label="Operational Action">
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
            <table className="responsive-table">
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
                    <td data-label="Station Name"><b>{s.stationName}</b></td>
                    <td data-label="Station Code">{s.stationCode}</td>
                    <td className="congestion-level-td" data-label="Congestion Index">
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
                    <td className="available-tracks-td" data-label="Available Tracks">
                      <select
                        value={s.availableTracks}
                        onChange={(e) => handleStationSlider(s.stationCode, "availableTracks", e.target.value)}
                        style={{ padding: "0.3rem" }}
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map(t => <option key={t} value={t}>{t} tracks</option>)}
                      </select>
                    </td>
                    <td className="waiting-trains-td" data-label="Waiting Trains">
                      <input
                        type="number"
                        min="0"
                        value={s.waitingTrains}
                        onChange={(e) => handleStationSlider(s.stationCode, "waitingTrains", e.target.value)}
                        style={{ padding: "0.3rem", width: "70px" }}
                      />
                    </td>
                    <td data-label="Operational Risk">
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
                    <div className="badge badge-danger" style={{ width: "100%", padding: "0.75rem", display: "block", textAlign: "center" }}>
                      {alertShortage}
                    </div>
                    <button 
                      className="btn-danger" 
                      style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", fontWeight: "bold" }}
                      onClick={() => {
                        if (window.confirm(`Decline booking ${selectedBookingRec.bookingId} due to critical wagon shortage?`)) {
                          handleUpdateStatus(selectedBookingRec.bookingId, "Declined");
                          setSelectedBookingRec(null);
                          setRecDetails(null);
                        }
                      }}
                    >
                      Decline booking due to shortage
                    </button>
                  </div>
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
                      <div key={w.wagonNumber} className="recommendation-wagon-item">
                        <span><b>{w.wagonNumber}</b> ({w.wagonType})</span>
                        <span style={{ color: w.isAtSource ? "var(--success)" : "var(--text-secondary)" }}>
                          Station: {w.currentStation} {w.isAtSource && "(Siding Match)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-actions-container">
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
