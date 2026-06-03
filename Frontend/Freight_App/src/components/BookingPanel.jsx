import React, { useState, useEffect } from "react";

import { API_BASE } from "../config";

function BookingPanel() {
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    sourceStation: "",
    destinationStation: "",
    cargoType: "",
    weight: "",
    priority: "Low"
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings`, { headers });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book wagon");
      }
      setFormData({ sourceStation: "", destinationStation: "", cargoType: "", weight: "", priority: "Low" });
      fetchBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${bookingId}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        fetchBookings();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel booking.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto calculate estimated wagons (50 tons per wagon)
  const estWagons = formData.weight ? Math.ceil(Number(formData.weight) / 50) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="glass-card">
        <div className="card-title">📦 Create Freight Booking & Wagon Request</div>
        {error && <div className="badge badge-danger" style={{ width: "100%", padding: "0.8rem", marginBottom: "1rem", display: "block" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Source Station Code</label>
              <input name="sourceStation" value={formData.sourceStation} onChange={handleChange} placeholder="e.g. NDLS" required />
            </div>
            <div className="form-group">
              <label>Destination Station Code</label>
              <input name="destinationStation" value={formData.destinationStation} onChange={handleChange} placeholder="e.g. BCT" required />
            </div>
            <div className="form-group">
              <label>Cargo Category</label>
              <select name="cargoType" value={formData.cargoType} onChange={handleChange} required>
                <option value="">Select Cargo Category</option>
                <option value="Coal">Coal (BOXN Open Siding)</option>
                <option value="Steel Slabs">Steel Slabs (BRN Flatbed)</option>
                <option value="Cement Bags">Cement Bags (BCN Covered)</option>
                <option value="Food Grains">Food Grains (BCN Covered)</option>
                <option value="Iron Ore">Iron Ore (BOXN Open Siding)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Cargo Net Weight (Tons)</label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 2400" required />
              {estWagons > 0 && (
                <span style={{ fontSize: "0.8rem", color: "var(--accent)", marginTop: "0.25rem", fontWeight: "600" }}>
                  Estimated Wagon allocation: <b>{estWagons}</b> (50t per wagon capacity)
                </span>
              )}
            </div>

          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: "1.5rem", width: "auto" }} disabled={loading}>
            {loading ? "Scheduling Bookings..." : "Book Wagons & Dispatch Request"}
          </button>
        </form>
      </div>

      {/* Active bookings list */}
      {bookings.length > 0 && (
        <div className="glass-card">
          <div className="card-title">📋 Active Dispatch Pipeline</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Route</th>
                  <th>Cargo Details</th>
                  <th>Priority</th>
                  <th>Wagons</th>
                  <th>Workflow Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.bookingId}>
                    <td><b>{b.bookingId}</b></td>
                    <td>{b.sourceStation} ➔ {b.destinationStation}</td>
                    <td>{b.cargoType} ({b.weight} tons)</td>
                    <td>
                      <span className={`badge badge-${b.priority === "Critical" ? "danger" : b.priority === "High" ? "warning" : "info"}`}>
                        {b.priority}
                      </span>
                    </td>
                    <td>{b.wagonCount}</td>
                    <td>
                      <span className={`badge badge-${b.bookingStatus === "Delivered" ? "success" : b.bookingStatus === "Submitted" ? "muted" : "info"}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }} onClick={() => setActiveReceipt(b)}>
                        Receipt
                      </button>
                      {["Draft", "Submitted"].includes(b.bookingStatus) && (
                        <button className="btn-danger" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }} onClick={() => handleCancelBooking(b.bookingId)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {activeReceipt && (
        <div className="receipt-overlay no-print">
          <div className="receipt-box">
            <div className="receipt-title">
              FREIGHTLINK INTELLIGENCE<br/>
              <span style={{ fontSize: "0.8rem", fontWeight: "normal" }}>RAIL FREIGHT RECEIPT</span>
            </div>
            
            <div className="receipt-row">
              <span>Receipt ID:</span>
              <span>{activeReceipt.bookingId}</span>
            </div>
            <div className="receipt-row">
              <span>Date Created:</span>
              <span>{new Date(activeReceipt.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="receipt-row" style={{ borderBottom: "1px dashed #000", paddingBottom: "0.5rem" }}>
              <span>Status:</span>
              <span><b>{activeReceipt.bookingStatus}</b></span>
            </div>

            <div className="receipt-row" style={{ marginTop: "0.5rem" }}>
              <span>Source Corridor:</span>
              <span><b>{activeReceipt.sourceStation}</b></span>
            </div>
            <div className="receipt-row">
              <span>Destination Siding:</span>
              <span><b>{activeReceipt.destinationStation}</b></span>
            </div>
            <div className="receipt-row">
              <span>Cargo Type:</span>
              <span>{activeReceipt.cargoType}</span>
            </div>
            <div className="receipt-row">
              <span>Total Weight:</span>
              <span>{activeReceipt.weight} Tons</span>
            </div>
            <div className="receipt-row" style={{ borderBottom: "1px dashed #000", paddingBottom: "0.5rem" }}>
              <span>Wagon Count:</span>
              <span>{activeReceipt.wagonCount} Wagons</span>
            </div>

            <div className="receipt-row" style={{ marginTop: "0.5rem" }}>
              <span>Priority Rank:</span>
              <span>{activeReceipt.priority}</span>
            </div>
            <div className="receipt-row">
              <span>Estimated Arrival:</span>
              <span>{new Date(activeReceipt.estimatedArrival).toLocaleDateString()}</span>
            </div>

            <div className="receipt-footer">
              *** ACADEMIC PROJECT DEMONSTRATION ***<br/>
              This application is simulated for learning purposes. Not connected to FOIS or Indian Railways databases.<br/><br/>
              <button className="btn-secondary no-print" style={{ color: "black", border: "1px solid black" }} onClick={() => window.print()}>
                Print Thermal Slip
              </button>
              <button className="btn-secondary no-print" style={{ color: "black", border: "1px solid black", marginLeft: "0.5rem" }} onClick={() => setActiveReceipt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingPanel;
