import React, { useEffect, useState } from "react";

import { API_BASE } from "../config";

function Profile({ handleLogout }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setProfileData(data);
        } else {
          setError(data.error || "Failed to retrieve profile");
        }
      } catch (err) {
        console.error(err);
        setError("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div
        className="glass-card"
        style={{ textAlign: "center", padding: "3rem" }}
      >
        <span className="loader"></span>
        <p style={{ marginTop: "1rem" }}>Retrieving security profile...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div
        className="glass-card"
        style={{ textAlign: "center", padding: "2rem" }}
      >
        <div className="badge badge-danger">
          {error || "Profile data missing"}
        </div>
      </div>
    );
  }

  const formattedDate = new Date(profileData.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: "450px",
          width: "100%",
          padding: "2.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top Gradient accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(90deg, var(--primary), var(--accent))",
          }}
        ></div>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: "bold",
              margin: "0 auto 1rem auto",
              boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.4)",
            }}
          >
            {profileData.name.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "700" }}>
            {profileData.name}
          </h2>
          <span
            className="badge badge-info"
            style={{
              textTransform: "uppercase",
              fontSize: "0.75rem",
              marginTop: "0.5rem",
              display: "inline-block",
            }}
          >
            {profileData.role === "officer"
              ? "Control Room Officer"
              : profileData.role === "admin"
                ? "System Admin"
                : "Shipper / Customer"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            marginBottom: "2.5rem",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              paddingBottom: "0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "0.25rem",
              }}
            >
              Email Address
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: "600" }}>
              {profileData.email}
            </div>
          </div>

          <div
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              paddingBottom: "0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "0.25rem",
              }}
            >
              Account Created At
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: "600" }}>
              {formattedDate}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            className="btn-primary"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.3)",
              width: "100%",
              padding: "0.8rem",
              fontSize: "1rem",
              border: "none",
              cursor: "pointer",
              borderRadius: "8px",
              fontWeight: "600",
            }}
            onClick={handleLogout}
          >
            LogOut
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
