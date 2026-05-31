const Station = require("../models/station");
const Wagon = require("../models/wagon");
const Booking = require("../models/booking");
const Notification = require("../models/notification");
const AuditLog = require("../models/auditLog");

const broadcastNotification = async (app, title, message) => {
  try {
    const notification = await Notification.create({
      userId: null,
      title,
      message,
      status: "unread"
    });
    const io = app.get("socketio");
    if (io) {
      io.emit("notification", notification);
    }
  } catch (err) {
    console.error("Demo notification error:", err);
  }
};

// 📌 SCENARIO 1: HEAVY RAINFALL
exports.triggerHeavyRainfall = async (req, res) => {
  try {
    // Simulate heavy rainfall on northern zone stations (NDLS, PNBE)
    await Station.updateMany(
      { stationCode: { $in: ["NDLS", "PNBE"] } },
      { congestionLevel: 75, waitingTrains: 5, availableTracks: 2 }
    );

    await broadcastNotification(
      req.app,
      "Severe Weather Warning 🌧️",
      "Heavy rainfall (48mm/h) reported in the Northern Corridor. High delay risks expected for NDLS & PNBE routes."
    );

    await AuditLog.create({
      action: "Triggered Professor Demo: Heavy Rainfall",
      user: req.user ? req.user.email : "Professor Demo Mode"
    });

    return res.json({
      success: true,
      scenario: "Heavy Rainfall",
      message: "Monsoon rainfall simulated. NDLS and PNBE station congestions set to 75%.",
      formFields: {
        source_code: "NDLS",
        destination_code: "BCT",
        distance: 1380,
        wagon_count: 50,
        total_weight: 3200,
        locomotive_power: 4500,
        congestion_level: 75,
        avg_wait_time: 45,
        rainfall: 48
      },
      insights: "Heavy downpours force speed limits, reducing average freight train speeds by 30%. The delay predictor incorporates this precipitation constraint."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 📌 SCENARIO 2: HEAVY CONGESTION
exports.triggerHeavyCongestion = async (req, res) => {
  try {
    // Set Kharagpur and Howrah to maximum congestion
    await Station.updateMany(
      { stationCode: { $in: ["KGP", "HWH"] } },
      { congestionLevel: 95, waitingTrains: 8, availableTracks: 0 }
    );

    await broadcastNotification(
      req.app,
      "Gridlock Congestion Alert ⚠️",
      "Critical gridlock (95% congestion) at Kharagpur Junction (KGP). Siding tracks full. Rerouting recommended."
    );

    await AuditLog.create({
      action: "Triggered Professor Demo: Heavy Congestion",
      user: req.user ? req.user.email : "Professor Demo Mode"
    });

    return res.json({
      success: true,
      scenario: "Heavy Congestion",
      message: "KGP and HWH stations set to 95% congestion, 0 tracks available.",
      formFields: {
        source_code: "KGP",
        destination_code: "HWH",
        distance: 115,
        wagon_count: 42,
        total_weight: 2500,
        locomotive_power: 4000,
        congestion_level: 95,
        avg_wait_time: 90,
        rainfall: 2
      },
      insights: "Congestion level of 95% triggers the AI Reroute suggestion, directing trains via secondary bypass networks."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 📌 SCENARIO 3: WAGON SHORTAGE
exports.triggerWagonShortage = async (req, res) => {
  try {
    // Mark almost all available BOXN wagons as Allocated or Maintenance
    await Wagon.updateMany(
      { wagonType: "BOXN" },
      { status: "Allocated" }
    );
    // Keep only one BOXN in maintenance
    await Wagon.findOneAndUpdate(
      { wagonType: "BOXN" },
      { status: "Maintenance" }
    );

    await broadcastNotification(
      req.app,
      "Wagon Availability Alert 🚨",
      "Wagon shortage: BOXN (Open Coal) wagons are currently at 0% free capacity. Coal loading operations may experience delays."
    );

    await AuditLog.create({
      action: "Triggered Professor Demo: Wagon Shortage",
      user: req.user ? req.user.email : "Professor Demo Mode"
    });

    return res.json({
      success: true,
      scenario: "Wagon Shortage",
      message: "All BOXN (Open) wagons changed to Allocated/Maintenance.",
      insights: "Requesting a Coal booking wagon recommendation will now instantly trigger an AI Wagon Shortage Alert."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 📌 SCENARIO 4: FESTIVAL FREIGHT RUSH
exports.triggerFestivalRush = async (req, res) => {
  try {
    // Set all stations to high congestion and waiting trains
    await Station.updateMany(
      {},
      { congestionLevel: 80, waitingTrains: 6, availableTracks: 1 }
    );

    await broadcastNotification(
      req.app,
      "Festival Peak Traffic 🎄",
      "Festival season surge: Freight volumes have increased by 45%. Siding wait times are elevated across all terminals."
    );

    await AuditLog.create({
      action: "Triggered Professor Demo: Festival Rush",
      user: req.user ? req.user.email : "Professor Demo Mode"
    });

    return res.json({
      success: true,
      scenario: "Festival Freight Rush",
      message: "All stations updated to 80% congestion level.",
      formFields: {
        source_code: "MAS",
        destination_code: "BCT",
        distance: 1280,
        wagon_count: 48,
        total_weight: 2900,
        locomotive_power: 4500,
        congestion_level: 80,
        avg_wait_time: 60,
        rainfall: 0
      },
      insights: "Peak demand restricts yard speeds and priority. The delay model predicts a minimum 12-hour overhead due to siding delays."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 📌 SCENARIO 5: COAL FREIGHT PRIORITY
exports.triggerCoalPriority = async (req, res) => {
  try {
    // Seed a specific Coal booking that is placed in Critical status and auto-allocate wagons
    const count = await Booking.countDocuments();
    const bookingId = "BK" + (1001 + count);

    // Make sure we have at least 1 Available BOXN wagon
    await Wagon.create({
      wagonNumber: "WGN-BOXN-TEMP-" + count,
      wagonType: "BOXN",
      capacity: 60,
      status: "Available",
      currentStation: "NDLS"
    });

    const booking = await Booking.create({
      bookingId,
      customerId: req.user ? req.user.id : mongoose.Types.ObjectId(),
      sourceStation: "NDLS",
      destinationStation: "BCT",
      cargoType: "Coal Fuel-Link",
      weight: 120,
      wagonCount: 2,
      priority: "Critical",
      bookingStatus: "Approved",
      estimatedArrival: new Date(Date.now() + 18 * 60 * 60 * 1000)
    });

    await broadcastNotification(
      req.app,
      "Coal Siding Clearance ⚡",
      `Critical coal priority booking ${bookingId} approved. Green corridor dispatch initiated to prevent power plant supply shortages.`
    );

    await AuditLog.create({
      action: "Triggered Professor Demo: Coal Priority Dispatch",
      user: req.user ? req.user.email : "Professor Demo Mode"
    });

    return res.json({
      success: true,
      scenario: "Coal Freight Priority",
      message: `Priority booking ${bookingId} created with CRITICAL status.`,
      booking,
      insights: "Critical supply bookings bypass typical queue delays, decreasing simulated transit delays by 40% on the track."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
