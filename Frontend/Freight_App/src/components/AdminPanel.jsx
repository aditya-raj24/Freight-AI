import React, { useEffect, useState } from "react";

import { API_BASE } from "../config";

function AdminPanel() {
  const [subTab, setSubTab] = useState("users"); // "users", "stations", "wagons", "logs", "officerIds"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data lists
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [wagons, setWagons] = useState([]);
  const [logs, setLogs] = useState([]);
  const [officerIds, setOfficerIds] = useState([]);

  // Form states
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [stationForm, setStationForm] = useState({ stationCode: "", stationName: "", lat: "", lng: "", availableTracks: 2 });
  const [wagonForm, setWagonForm] = useState({ wagonNumber: "", wagonType: "BOXN", capacity: 60, currentStation: "NDLS", status: "Available" });
  const [officerIdForm, setOfficerIdForm] = useState({ govId: "", name: "" });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings`, { headers }); // Fetch bookings will give bookings, but wait, do we have an API for users?
      // Since the API requirements don't strictly mandate GET /api/users, we can fetch all bookings or return default seeded users if needed.
      // Wait, let's look at the database. If there's no route /api/users, we can create one in Backend/src/routes/authRoutes.js!
      // Yes! That's clean. Let's make sure we fetch users. Let's write a mock fallback or query the auth profiles.
      // Actually, let's create a route for get users. In our seed script we created admin, officer, customer.
      // Let's implement fetch from `/api/auth/users` if we add it, or fall back to mock list. To make it 100% robust, let's fetch from `/api/auth/users`. We will make sure this endpoint is added to authRoutes.js.
      const resU = await fetch(`${API_BASE}/auth/users`, { headers });
      if (resU.ok) {
        const data = await resU.json();
        setUsers(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchStations = async () => {
    try {
      const res = await fetch(`${API_BASE}/stations`, { headers });
      const data = await res.json();
      setStations(data);
    } catch (err) { console.error(err); }
  };

  const fetchWagons = async () => {
    try {
      const res = await fetch(`${API_BASE}/wagons`, { headers });
      const data = await res.json();
      setWagons(data);
    } catch (err) { console.error(err); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/audit-logs`, { headers });
      const data = await res.json();
      setLogs(data);
    } catch (err) { console.error(err); }
  };

  const fetchOfficerIds = async () => {
    try {
      const res = await fetch(`${API_BASE}/officer-ids`, { headers });
      const data = await res.json();
      setOfficerIds(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (subTab === "users") fetchUsers();
    if (subTab === "stations") fetchStations();
    if (subTab === "wagons") fetchWagons();
    if (subTab === "logs") fetchLogs();
    if (subTab === "officerIds") fetchOfficerIds();
  }, [subTab]);

  // CREATE handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers,
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        setUserForm({ name: "", email: "", password: "", role: "customer" });
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) { setError(err.message); }
  };

  const handleCreateStation = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        stationCode: stationForm.stationCode,
        stationName: stationForm.stationName,
        availableTracks: Number(stationForm.availableTracks),
        location: { lat: Number(stationForm.lat), lng: Number(stationForm.lng) }
      };
      const res = await fetch(`${API_BASE}/stations`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setStationForm({ stationCode: "", stationName: "", lat: "", lng: "", availableTracks: 2 });
        fetchStations();
      }
    } catch (err) { setError(err.message); }
  };

  const handleCreateWagon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/wagons`, {
        method: "POST",
        headers,
        body: JSON.stringify(wagonForm)
      });
      if (res.ok) {
        setWagonForm({ wagonNumber: "", wagonType: "BOXN", capacity: 60, currentStation: "NDLS", status: "Available" });
        fetchWagons();
      }
    } catch (err) { setError(err.message); }
  };

  // DELETE handlers
  const handleDeleteStation = async (code) => {
    try {
      await fetch(`${API_BASE}/stations/${code}`, { method: "DELETE", headers });
      fetchStations();
    } catch (err) { console.error(err); }
  };

  const handleDeleteWagon = async (num) => {
    try {
      await fetch(`${API_BASE}/wagons/${num}`, { method: "DELETE", headers });
      fetchWagons();
    } catch (err) { console.error(err); }
  };

  const handleCreateOfficerId = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/officer-ids`, {
        method: "POST",
        headers,
        body: JSON.stringify(officerIdForm)
      });
      if (res.ok) {
        setOfficerIdForm({ govId: "", name: "" });
        fetchOfficerIds();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) { setError(err.message); }
  };

  const handleDeleteOfficerId = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/officer-ids/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        fetchOfficerIds();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Sub Tabs */}
      <div className="glass-card" style={{ display: "flex", gap: "1rem" }}>
        <button className={`btn-secondary ${subTab === "users" ? "btn-primary" : ""}`} onClick={() => setSubTab("users")}>Users CRUD</button>
        <button className={`btn-secondary ${subTab === "stations" ? "btn-primary" : ""}`} onClick={() => setSubTab("stations")}>Stations CRUD</button>
        <button className={`btn-secondary ${subTab === "wagons" ? "btn-primary" : ""}`} onClick={() => setSubTab("wagons")}>Wagons CRUD</button>
        <button className={`btn-secondary ${subTab === "logs" ? "btn-primary" : ""}`} onClick={() => setSubTab("logs")}>Audit Logs</button>
        <button className={`btn-secondary ${subTab === "officerIds" ? "btn-primary" : ""}`} onClick={() => setSubTab("officerIds")}>Officer IDs CRUD</button>
      </div>

      {error && <div className="badge badge-danger" style={{ padding: "0.8rem" }}>{error}</div>}

      {/* ==================== USERS SECTION ==================== */}
      {subTab === "users" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
          <div className="glass-card">
            <div className="card-title">Add User Accounts</div>
            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="customer">Customer</option>
                  <option value="officer">Control Room Officer</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Register Account</button>
            </form>
          </div>

          <div className="glass-card">
            <div className="card-title">System Users</div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge badge-${u.role === "officer" ? "info" : "success"}`}>{u.role}</span></td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STATIONS SECTION ==================== */}
      {subTab === "stations" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
          <div className="glass-card">
            <div className="card-title">Register Station</div>
            <form onSubmit={handleCreateStation} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Station Code</label>
                <input type="text" value={stationForm.stationCode} onChange={(e) => setStationForm({ ...stationForm, stationCode: e.target.value })} placeholder="e.g. NDLS" required />
              </div>
              <div className="form-group">
                <label>Station Name</label>
                <input type="text" value={stationForm.stationName} onChange={(e) => setStationForm({ ...stationForm, stationName: e.target.value })} placeholder="e.g. New Delhi" required />
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
                <div>
                  <label>Lat</label>
                  <input type="number" step="0.0001" value={stationForm.lat} onChange={(e) => setStationForm({ ...stationForm, lat: e.target.value })} placeholder="e.g. 28.64" required />
                </div>
                <div>
                  <label>Lng</label>
                  <input type="number" step="0.0001" value={stationForm.lng} onChange={(e) => setStationForm({ ...stationForm, lng: e.target.value })} placeholder="e.g. 77.21" required />
                </div>
              </div>
              <div className="form-group">
                <label>Tracks Count</label>
                <input type="number" value={stationForm.availableTracks} onChange={(e) => setStationForm({ ...stationForm, availableTracks: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary">Add Station</button>
            </form>
          </div>

          <div className="glass-card">
            <div className="card-title">System Stations</div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Congestion</th>
                    <th>Waiting Trains</th>
                    <th>Tracks</th>
                    <th>Coordinates</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((s) => (
                    <tr key={s._id}>
                      <td><b>{s.stationCode}</b></td>
                      <td>{s.stationName}</td>
                      <td>{s.congestionLevel}%</td>
                      <td>{s.waitingTrains}</td>
                      <td>{s.availableTracks}</td>
                      <td>{s.location.lat}, {s.location.lng}</td>
                      <td>
                        <button className="btn-danger" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }} onClick={() => handleDeleteStation(s.stationCode)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== WAGONS SECTION ==================== */}
      {subTab === "wagons" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
          <div className="glass-card">
            <div className="card-title">Add Wagon Stock</div>
            <form onSubmit={handleCreateWagon} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Wagon Number</label>
                <input type="text" value={wagonForm.wagonNumber} onChange={(e) => setWagonForm({ ...wagonForm, wagonNumber: e.target.value })} placeholder="e.g. WGN-BOXN-5015" required />
              </div>
              <div className="form-group">
                <label>Wagon Type</label>
                <select value={wagonForm.wagonType} onChange={(e) => setWagonForm({ ...wagonForm, wagonType: e.target.value })}>
                  <option value="BOXN">BOXN (Open Coal/Ore)</option>
                  <option value="BCN">BCN (Covered Grains/Cement)</option>
                  <option value="BRN">BRN (Flat Rails/Steel)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Capacity Load (Tons)</label>
                <input type="number" value={wagonForm.capacity} onChange={(e) => setWagonForm({ ...wagonForm, capacity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Current Siding Location</label>
                <input type="text" value={wagonForm.currentStation} onChange={(e) => setWagonForm({ ...wagonForm, currentStation: e.target.value })} placeholder="NDLS" required />
              </div>
              <div className="form-group">
                <label>Availability Status</label>
                <select value={wagonForm.status} onChange={(e) => setWagonForm({ ...wagonForm, status: e.target.value })}>
                  <option value="Available">Available</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Add Wagon</button>
            </form>
          </div>

          <div className="glass-card">
            <div className="card-title">Wagon Fleet</div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Wagon Num</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Station</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wagons.map((w) => (
                    <tr key={w._id}>
                      <td><b>{w.wagonNumber}</b></td>
                      <td>{w.wagonType}</td>
                      <td>{w.capacity}t</td>
                      <td>{w.currentStation}</td>
                      <td><span className={`badge badge-${w.status === "Available" ? "success" : w.status === "Allocated" ? "info" : "warning"}`}>{w.status}</span></td>
                      <td>
                        <button className="btn-danger" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }} onClick={() => handleDeleteWagon(w.wagonNumber)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== AUDIT LOGS ==================== */}
      {subTab === "logs" && (
        <div className="glass-card">
          <div className="card-title">System Audit Log History</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Triggered</th>
                  <th>Operator</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id}>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{new Date(l.timestamp).toLocaleString()}</td>
                    <td>{l.action}</td>
                    <td><span className="badge badge-info">{l.user}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== OFFICER IDS CRUD SECTION ==================== */}
      {subTab === "officerIds" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
          <div className="glass-card">
            <div className="card-title">Authorize Officer ID</div>
            <form onSubmit={handleCreateOfficerId} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Government Officer ID</label>
                <input 
                  type="text" 
                  value={officerIdForm.govId} 
                  onChange={(e) => setOfficerIdForm({ ...officerIdForm, govId: e.target.value })} 
                  placeholder="e.g. GOV-OFFICER-999" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Officer Name / Designation</label>
                <input 
                  type="text" 
                  value={officerIdForm.name} 
                  onChange={(e) => setOfficerIdForm({ ...officerIdForm, name: e.target.value })} 
                  placeholder="e.g. Deputy Siding Master" 
                  required 
                />
              </div>
              <button type="submit" className="btn-primary">Authorize ID</button>
            </form>
          </div>

          <div className="glass-card">
            <div className="card-title">Pre-Authorized Officer Credentials</div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Government ID</th>
                    <th>Authorized Name</th>
                    <th>Status</th>
                    <th>Registered User</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {officerIds.map((item) => (
                    <tr key={item._id}>
                      <td><b>{item.govId}</b></td>
                      <td>{item.name}</td>
                      <td>
                        <span className={`badge badge-${item.isUsed ? "info" : "success"}`}>
                          {item.isUsed ? "Registered/Used" : "Available"}
                        </span>
                      </td>
                      <td>
                        {item.assignedTo ? (
                          <span style={{ fontSize: "0.85rem" }}>
                            {item.assignedTo.name} ({item.assignedTo.email})
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>—</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn-danger" 
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }} 
                          disabled={item.isUsed}
                          onClick={() => handleDeleteOfficerId(item._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
