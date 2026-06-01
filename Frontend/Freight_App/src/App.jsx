import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Auth from "./components/Auth";
import DashboardOverview from "./components/DashboardOverview";
import AIPanel from "./components/AIPanel";
import BookingPanel from "./components/BookingPanel";
import Operations from "./components/Operations";
import TrainTracking from "./components/TrainTracking";
import AnalyticsView from "./components/AnalyticsView";
import AdminPanel from "./components/AdminPanel";
import Profile from "./components/Profile";
import { API_BASE, SOCKET_URL } from "./config";

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // sidebar routes
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  // Demo mode messages
  const [demoAlert, setDemoAlert] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 
  // Check login on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (!localStorage.getItem("originalRole")) {
        localStorage.setItem("originalRole", parsedUser.role);
      }
    }
  }, []);

  // Socket.IO Notifications Connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Initial notifications fetch
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/bookings`, { // Fallback/Fetch notifications
          headers: { Authorization: `Bearer ${token}` }
        });
        // We'll mock a default notification to load first
        setNotifications([
          { _id: "n1", title: "Welcome to FreightLink", message: `Connected as ${user.name} (${user.role.toUpperCase()})`, status: "unread", createdAt: new Date() }
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();

    newSocket.on("notification", (newNotif) => {
      // Play a clean browser alert sound if available
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        console.warn("Audio Context blocked:", e);
      }

      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => newSocket.close();
  }, [user]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("originalRole", userData.role);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("originalRole");
    setUser(null);
    setActiveTab("dashboard");
    if (socket) socket.close();
  };

  // PROFESSOR DEMO TRIGGER FUNCTION
  const triggerDemoScenario = async (scenarioPath, name) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/demo/${scenarioPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setDemoAlert({
          scenarioName: name,
          message: data.message,
          insights: data.insights
        });
        
        // Refresh notifications
        setNotifications((prev) => [
          { _id: "d" + Date.now(), title: `${name} Scenario Activated`, message: data.message, status: "unread", createdAt: new Date() },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };


  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Filter sidebar tabs by Role
  const isCustomer = user.role === "customer";
  const isOfficer = user.role === "officer";

  const unreadCount = notifications.filter(n => n.status === "unread").length;

  return (
    <div className={`app-container ${isSidebarOpen ? "sidebar-mobile-open" : ""}`}>
      <div className="bg-gradient-overlay"></div>
      
      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="logo-container">
          <div className="logo-icon">🚆</div>
          <span className="logo-text">FreightLink AI</span>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>

        <nav className="nav-links">
          <button className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false); }}>
            <span>📊</span> Dashboard
          </button>

          {isCustomer && (
            <>
              <button className={`nav-item ${activeTab === "ai" ? "active" : ""}`} onClick={() => { setActiveTab("ai"); setIsSidebarOpen(false); }}>
                <span>🤖</span> AI Scheduling
              </button>
              <button className={`nav-item ${activeTab === "booking" ? "active" : ""}`} onClick={() => { setActiveTab("booking"); setIsSidebarOpen(false); }}>
                <span>📦</span> Freight Booking
              </button>
            </>
          )}

          {isOfficer && (
            <button className={`nav-item ${activeTab === "operations" ? "active" : ""}`} onClick={() => { setActiveTab("operations"); setIsSidebarOpen(false); }}>
              <span>⚙️</span> Control Room
            </button>
          )}

          <button className={`nav-item ${activeTab === "tracking" ? "active" : ""}`} onClick={() => { setActiveTab("tracking"); setIsSidebarOpen(false); }}>
            <span>📍</span> Train Tracking
          </button>

          {isOfficer && (
            <>
              <button className={`nav-item ${activeTab === "analytics" ? "active" : ""}`} onClick={() => { setActiveTab("analytics"); setIsSidebarOpen(false); }}>
                <span>📈</span> Analytics
              </button>
              <button className={`nav-item ${activeTab === "admin" ? "active" : ""}`} onClick={() => { setActiveTab("admin"); setIsSidebarOpen(false); }}>
                <span>⚙️</span> Data Management
              </button>
            </>
          )}

        </nav>

        {/* User Profile Info Badge (Acts as Active Profile Tab Button) */}
        <div 
          className={`user-badge ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => { setActiveTab("profile"); setIsSidebarOpen(false); }}
        >
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        
        {/* Global Header */}
        <header className="no-print">
          <div className="header-left-group">
            <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
              ☰
            </button>
            <div className="header-title-section">
              <h1>FreightLink Intelligence</h1>
              <p>Academic AI Railway Logistics Scheduler</p>
            </div>
          </div>

          {/* Academic Global Disclaimer
          <div className="disclaimer-banner">
            🚨 <b>Academic Project Disclaimer:</b> All train locations, scheduling forecasts, and siding tracks configurations are simulated. Not connected to FOIS or Indian Railways databases.
          </div>
          */}

          <div className="header-actions">
            
            {/* Notification Bell */}
            <div className="notification-bell-container">
              <button className="icon-btn" onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                <span>🔔</span>
                {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
              </button>

              {showNotifDropdown && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <span>Notifications Center</span>
                    <button className="btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }} onClick={() => setNotifications([])}>
                      Clear
                    </button>
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className={`notification-item ${n.status === "unread" ? "unread" : ""}`}>
                          <div className="notification-item-title">{n.title}</div>
                          <div>{n.message}</div>
                          <div className="notification-item-time">{new Date(n.createdAt).toLocaleTimeString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic Views Content Router */}
        <div style={{ paddingBottom: "80px" }}> {/* spacing for demo toolbar */}
          {activeTab === "dashboard" && <DashboardOverview onNavigate={setActiveTab} user={user} />}
          {activeTab === "ai" && isCustomer && <AIPanel />}
          {activeTab === "booking" && isCustomer && <BookingPanel />}
          {activeTab === "operations" && isOfficer && <Operations />}
          {activeTab === "tracking" && <TrainTracking />}
          {activeTab === "analytics" && isOfficer && <AnalyticsView />}
          {activeTab === "admin" && isOfficer && <AdminPanel />}
          {activeTab === "profile" && <Profile handleLogout={handleLogout} />}
        </div>

        {/* Floating AI Insight Card for Demo Scenarios
        {demoAlert && (
          <div className="receipt-overlay no-print" style={{ zIndex: 1050 }}>
            <div className="glass-card" style={{ maxWidth: "500px", width: "100%", borderLeft: "5px solid var(--accent)" }}>
              <div className="card-title" style={{ justifyContent: "space-between", display: "flex" }}>
                <span>💡 AI Simulator Insights: {demoAlert.scenarioName}</span>
                <span style={{ cursor: "pointer", color: "var(--danger)" }} onClick={() => setDemoAlert(null)}>✕</span>
              </div>
              <p style={{ fontSize: "0.95rem", color: "white", marginBottom: "0.75rem" }}>
                <b>State Change:</b> {demoAlert.message}
              </p>
              <div style={{ padding: "0.75rem 1rem", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                <b>Grading Insight:</b> {demoAlert.insights}
              </div>
              <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-primary" onClick={() => setDemoAlert(null)}>Close Simulation Overlay</button>
              </div>
            </div>
          </div>
        )}
        */}

        {/* Professor Demo Toolbar Footer
        <div className="demo-toolbar no-print">
          <div className="demo-toolbar-scenarios">
            <span style={{ fontWeight: "bold", color: "var(--accent)" }}>🎓 Professor Demo Mode:</span>
            <button className="demo-scenario-btn" onClick={() => triggerDemoScenario("rain", "Heavy Rainfall")}>🌦️ Heavy Rain</button>
            <button className="demo-scenario-btn" onClick={() => triggerDemoScenario("congestion", "Yard Congestion")}>⚠️ Yard Congestion</button>
            <button className="demo-scenario-btn" onClick={() => triggerDemoScenario("shortage", "Wagon Shortage")}>🚨 Wagon Shortage</button>
            <button className="demo-scenario-btn" onClick={() => triggerDemoScenario("rush", "Festival Rush")}>🎄 Holiday Rush</button>
            <button className="demo-scenario-btn" onClick={() => triggerDemoScenario("coal", "Coal Priority")}>⚡ Coal Priority</button>
          </div>
        </div>
        */}

      </main>
    </div>
  );
}

export default App;
