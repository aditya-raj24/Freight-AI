require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Import route files
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const stationRoutes = require("./routes/stationRoutes");
const wagonRoutes = require("./routes/wagonRoutes");
const aiRoutes = require("./routes/aiRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const demoRoutes = require("./routes/demoRoutes");
const officerIdRoutes = require("./routes/officerIdRoutes");

const app = express();

// ==============================
// DATABASE CONNECTION
// ==============================
connectDB();

// ==============================
// MIDDLEWARE & SECURITY
// ==============================
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // JSON parser

// Rate Limiter: max 5000 requests per 15 minutes per IP (increased for dev/testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/", limiter);

// ==============================
// ROUTING MIDDLEWARE
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/wagons", wagonRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/officer-ids", officerIdRoutes);

// ==============================
// ROOT CHECK
// ==============================
app.get("/", (req, res) => {
  res.json({
    message: "FreightLink Intelligence Backend is fully operational 🚆",
    version: "2.0.0"
  });
});

// ==============================
// ERROR HANDLING
// ==============================
app.use((req, res, next) => {
  res.status(404).json({ error: "API Route not found." });
});

app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({ error: "Internal server error." });
});

// ==============================
// EXPORT APP
// ==============================
module.exports = app;
