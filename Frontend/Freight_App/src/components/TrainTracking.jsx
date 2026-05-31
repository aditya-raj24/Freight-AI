import React, { useEffect, useRef, useState } from "react";

import { API_BASE } from "../config";

function TrainTracking() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const trainMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [stations, setStations] = useState([]);
  const [trackingInfo, setTrackingInfo] = useState({
    speed: 0,
    distanceRemaining: 0,
    progress: 0,
    eta: "Calculating...",
    status: "Idle"
  });

  // Fetch stations and active bookings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        
        const stationsRes = await fetch(`${API_BASE}/stations`, { headers });
        const stationsData = await stationsRes.json();
        setStations(stationsData);

        const bookingsRes = await fetch(`${API_BASE}/bookings`, { headers });
        const bookingsData = await bookingsRes.json();
        
        // Filter bookings that have been scheduled, allocated, transit, or delivered
        const trackable = bookingsData.bookings.filter(b => 
          ["Wagon Allocated", "Train Scheduled", "In Transit", "Delivered"].includes(b.bookingStatus)
        );
        setBookings(trackable);
        if (trackable.length > 0) {
          setSelectedBooking(trackable[0]);
        }
      } catch (err) {
        console.error("Tracking fetch error:", err);
      }
    };
    fetchData();
  }, []);

  // Set up and update Leaflet Map
  useEffect(() => {
    if (!window.L || stations.length === 0) return;

    // Check if Leaflet map already initialized
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map("tracking-map").setView([22.5, 80], 5);
      
      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(mapInstanceRef.current);
    }

    const L = window.L;

    // Custom SVG icon to prevent default icon asset loading issues in Vite
    const createStationIcon = (color) => L.divIcon({
      html: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3"><circle cx="12" cy="12" r="8" fill="#0f172a"/></svg>`,
      className: "custom-station-icon",
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    const trainIcon = L.divIcon({
      html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.5"><path d="M4 15h16M4 19h16M6 11h12M8 7h8" fill="none"/><circle cx="8" cy="19" r="2" fill="#a855f7"/><circle cx="16" cy="19" r="2" fill="#a855f7"/></svg>`,
      className: "custom-train-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Clear existing markers and polylines
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Draw all stations
    stations.forEach((s) => {
      L.marker([s.location.lat, s.location.lng], { icon: createStationIcon("#4f46e5") })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${s.stationName} (${s.stationCode})</b><br/>Congestion: ${s.congestionLevel}%`);
    });

    if (!selectedBooking) return;

    // Find source and destination details
    const sourceStation = stations.find(s => s.stationCode === selectedBooking.sourceStation);
    const destStation = stations.find(s => s.stationCode === selectedBooking.destinationStation);

    if (!sourceStation || !destStation) return;

    const routeCoords = [
      [sourceStation.location.lat, sourceStation.location.lng],
      [destStation.location.lat, destStation.location.lng]
    ];

    // Plot Source and Dest with distinctive colors
    L.marker(routeCoords[0], { icon: createStationIcon("#10b981") })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>Source: ${sourceStation.stationName}</b>`);

    L.marker(routeCoords[1], { icon: createStationIcon("#ef4444") })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>Destination: ${destStation.stationName}</b>`);

    // Draw route polyline
    const polyline = L.polyline(routeCoords, { color: "#4f46e5", weight: 4, opacity: 0.8, dashArray: "10, 10" })
      .addTo(mapInstanceRef.current);
    polylineRef.current = polyline;

    // Pan map to fit route
    mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    // Place simulated train marker
    const trainMarker = L.marker(routeCoords[0], { icon: trainIcon }).addTo(mapInstanceRef.current);
    trainMarkerRef.current = trainMarker;

    // Simulate train movement
    let step = 0;
    const totalSteps = 100;
    
    // Set status based on booking status
    const statusMap = {
      "Wagon Allocated": { speed: 0, status: "Staged at Yard", progressMult: 0 },
      "Train Scheduled": { speed: 0, status: "Awaiting Dispatch", progressMult: 0 },
      "In Transit": { speed: 75, status: "Moving", progressMult: 1 },
      "Delivered": { speed: 0, status: "Delivered", progressMult: 100 }
    };

    const config = statusMap[selectedBooking.bookingStatus] || { speed: 65, status: "Moving", progressMult: 1 };
    
    const interval = setInterval(() => {
      if (selectedBooking.bookingStatus === "Delivered") {
        setTrackingInfo({
          speed: 0,
          distanceRemaining: 0,
          progress: 100,
          eta: "Delivered",
          status: "Arrived at Destination"
        });
        trainMarker.setLatLng(routeCoords[1]);
        clearInterval(interval);
        return;
      }

      if (config.speed === 0) {
        setTrackingInfo({
          speed: 0,
          distanceRemaining: selectedBooking.weight > 2000 ? 550 : 280,
          progress: 0,
          eta: "Pending Departure",
          status: config.status
        });
        trainMarker.setLatLng(routeCoords[0]);
        clearInterval(interval);
        return;
      }

      // Animate movement along the polyline path
      step = (step + 1) % totalSteps;
      const lat = sourceStation.location.lat + (destStation.location.lat - sourceStation.location.lat) * (step / totalSteps);
      const lng = sourceStation.location.lng + (destStation.location.lng - sourceStation.location.lng) * (step / totalSteps);
      
      trainMarker.setLatLng([lat, lng]);

      const pct = Math.round((step / totalSteps) * 100);
      const remaining = Math.round(500 * (1 - (step / totalSteps)));
      const hoursLeft = (remaining / config.speed).toFixed(1);

      setTrackingInfo({
        speed: config.speed + Math.floor(Math.random() * 10 - 5),
        distanceRemaining: remaining,
        progress: pct,
        eta: `${hoursLeft} hours`,
        status: "In Transit"
      });
    }, 1500);

    return () => {
      clearInterval(interval);
    };

  }, [selectedBooking, stations]);

  return (
    <div className="glass-card">
      <div className="card-title">
        <span>📍 Simulated Real-Time Train Tracking</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {bookings.length === 0 ? (
          <div className="badge badge-warning" style={{ width: "100%", padding: "1rem", textAlign: "center" }}>
            No active dispatched trains found. Please create a booking and approve it to see live tracking.
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ margin: 0 }}>Select Active Dispatch:</label>
            <select 
              value={selectedBooking ? selectedBooking.bookingId : ""} 
              onChange={(e) => setSelectedBooking(bookings.find(b => b.bookingId === e.target.value))}
              style={{ width: "auto", minWidth: "220px" }}
            >
              {bookings.map(b => (
                <option key={b.bookingId} value={b.bookingId}>
                  {b.bookingId} ({b.cargoType}) : {b.sourceStation} ➔ {b.destinationStation}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="map-container-wrapper">
          <div id="tracking-map"></div>
          <div className="map-disclaimer">
            ⚠️ <b>Disclaimer:</b> Train locations are simulated for academic demonstration purposes and are not connected to any live railway system.
          </div>
        </div>

        {selectedBooking && (
          <div className="kpi-grid" style={{ marginTop: "1rem" }}>
            <div className="kpi-card">
              <span className="kpi-title">Current Status</span>
              <span className="kpi-value" style={{ fontSize: "1.3rem", color: "var(--accent)" }}>{trackingInfo.status}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-title">Speed (Simulated)</span>
              <span className="kpi-value" style={{ fontSize: "1.3rem" }}>{trackingInfo.speed} km/h</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-title">Distance Remaining</span>
              <span className="kpi-value" style={{ fontSize: "1.3rem" }}>{trackingInfo.distanceRemaining} km</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-title">Estimated Transit</span>
              <span className="kpi-value" style={{ fontSize: "1.3rem" }}>{trackingInfo.eta}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainTracking;
