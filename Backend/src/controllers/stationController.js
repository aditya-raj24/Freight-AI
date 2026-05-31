const Station = require("../models/station");
const Notification = require("../models/notification");
const AuditLog = require("../models/auditLog");

// Broadcast utility
const sendAlert = async (app, title, message) => {
  try {
    const notification = await Notification.create({
      userId: null, // Global broadcast
      title,
      message,
      status: "unread"
    });
    const io = app.get("socketio");
    if (io) {
      io.emit("notification", notification);
    }
  } catch (err) {
    console.error("Alert error:", err);
  }
};

// 📌 GET ALL STATIONS
exports.getAllStations = async (req, res) => {
  try {
    const stations = await Station.find().sort({ stationCode: 1 });
    return res.json(stations);
  } catch (error) {
    console.error("Fetch stations error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 CREATE STATION (Admin Only)
exports.createStation = async (req, res) => {
  try {
    const { stationCode, stationName, congestionLevel, waitingTrains, availableTracks, location } = req.body;

    if (!stationCode || !stationName || !location || location.lat == null || location.lng == null) {
      return res.status(400).json({ error: "Code, Name, and Location Coordinates are required." });
    }

    const exists = await Station.findOne({ stationCode: stationCode.toUpperCase() });
    if (exists) {
      return res.status(400).json({ error: "Station with this code already exists." });
    }

    const station = await Station.create({
      stationCode: stationCode.toUpperCase(),
      stationName,
      congestionLevel: Number(congestionLevel || 0),
      waitingTrains: Number(waitingTrains || 0),
      availableTracks: Number(availableTracks || 2),
      location
    });

    await AuditLog.create({
      action: `Created Station ${station.stationCode}`,
      user: req.user.email
    });

    return res.status(201).json({ message: "Station created successfully", station });
  } catch (error) {
    console.error("Create station error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 UPDATE STATION
exports.updateStation = async (req, res) => {
  try {
    const { id } = req.params; // Station Code
    const { congestionLevel, waitingTrains, availableTracks, stationName, location } = req.body;

    const station = await Station.findOne({ stationCode: id.toUpperCase() });
    if (!station) {
      return res.status(404).json({ error: "Station not found." });
    }

    const prevCongestion = station.congestionLevel;

    if (congestionLevel != null) station.congestionLevel = Number(congestionLevel);
    if (waitingTrains != null) station.waitingTrains = Number(waitingTrains);
    if (availableTracks != null) station.availableTracks = Number(availableTracks);
    if (stationName) station.stationName = stationName;
    if (location) station.location = location;

    await station.save();

    // Congestion alert trigger
    if (station.congestionLevel > 80 && prevCongestion <= 80) {
      await sendAlert(
        req.app,
        "High Congestion Alert ⚠️",
        `Station ${station.stationName} (${station.stationCode}) congestion has reached ${station.congestionLevel}%! Waiting trains: ${station.waitingTrains}.`
      );
    }

    await AuditLog.create({
      action: `Updated Station ${station.stationCode} parameters`,
      user: req.user.email
    });

    return res.json({ message: "Station updated successfully", station });
  } catch (error) {
    console.error("Update station error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 DELETE STATION (Admin Only)
exports.deleteStation = async (req, res) => {
  try {
    const { id } = req.params;
    const station = await Station.findOne({ stationCode: id.toUpperCase() });

    if (!station) {
      return res.status(404).json({ error: "Station not found." });
    }

    await Station.deleteOne({ stationCode: id.toUpperCase() });

    await AuditLog.create({
      action: `Deleted Station ${id}`,
      user: req.user.email
    });

    return res.json({ message: `Station ${id} deleted successfully.` });
  } catch (error) {
    console.error("Delete station error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
