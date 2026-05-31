import React, { useState } from "react";

import { API_BASE } from "../config";

function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // "login", "register", "forgot"
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    govId: "",
    newPassword: "",
    otp: ""
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const changeMode = (newMode) => {
    setMode(newMode);
    setOtpSent(false);
    setError(null);
    setSuccess(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      govId: "",
      newPassword: "",
      otp: ""
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    let url = `${API_BASE}/auth/login`;
    let payload = { email: formData.email, password: formData.password };

    if (mode === "register") {
      url = `${API_BASE}/auth/register`;
      payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        govId: formData.govId
      };
    } else if (mode === "forgot") {
      url = `${API_BASE}/auth/forgot-password`;
      if (!otpSent) {
        payload = { email: formData.email };
      } else {
        payload = { 
          email: formData.email, 
          otp: formData.otp, 
          newPassword: formData.newPassword 
        };
      }
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Request failed.");
      }

      if (mode === "forgot") {
        if (!otpSent) {
          setOtpSent(true);
          setSuccess(data.message);
        } else {
          setSuccess(data.message);
          changeMode("login");
        }
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-logo">🚆 FreightLink Intelligence</div>
          <p style={{ color: "var(--text-secondary)" }}>
            {mode === "login" && "Sign in to access your freight dashboard"}
            {mode === "register" && "Create an account to book and track wagons"}
            {mode === "forgot" && (!otpSent ? "Request a verification code to reset password" : "Verify OTP and set your new password")}
          </p>
        </div>

        {error && <div className="badge badge-danger" style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", display: "block", textAlign: "center" }}>{error}</div>}
        {success && <div className="badge badge-success" style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", display: "block", textAlign: "center" }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {mode === "register" && (
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="user@freightlink.com" 
              required 
              disabled={mode === "forgot" && otpSent}
            />
          </div>

          {mode !== "forgot" && (
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="••••••••" 
                required 
                minLength={mode === "register" ? 8 : undefined}
              />
            </div>
          )}

          {mode === "forgot" && otpSent && (
            <>
              <div className="form-group">
                <label>Verification OTP (6-digits)</label>
                <input 
                  type="text" 
                  name="otp" 
                  value={formData.otp} 
                  onChange={handleChange} 
                  placeholder="Enter 6-digit OTP code" 
                  required 
                  maxLength={6}
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={formData.newPassword} 
                  onChange={handleChange} 
                  placeholder="Enter new password" 
                  required 
                  minLength={8}
                />
              </div>
            </>
          )}

          {mode === "register" && (
            <div className="form-group">
              <label>Government Officer ID (Optional)</label>
              <input 
                type="text" 
                name="govId" 
                value={formData.govId} 
                onChange={handleChange} 
                placeholder="e.g. GOV-OFFICER-456" 
              />
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.25rem", display: "block" }}>
                Leave empty to register as a Customer. Enter a valid Government ID to register as a Control Room Officer.
              </span>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading 
              ? "Processing..." 
              : mode === "login" 
                ? "Login" 
                : mode === "register" 
                  ? "Register" 
                  : !otpSent 
                    ? "Send Reset OTP" 
                    : "Verify & Reset Password"
            }
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
          {mode === "login" ? (
            <>
              <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => changeMode("forgot")}>Forgot Password?</span>
              <span style={{ color: "var(--text-secondary)" }}>New? <strong style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => changeMode("register")}>Register</strong></span>
            </>
          ) : (
            <span style={{ color: "var(--text-secondary)", cursor: "pointer" }} onClick={() => changeMode("login")}>Back to Login</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
