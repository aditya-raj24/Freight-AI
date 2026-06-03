const Wagon = require("../models/wagon");
const Booking = require("../models/booking");
const Notification = require("../models/notification");
const AuditLog = require("../models/auditLog");

// Helper to broadcast notification via Socket.IO
const sendAlert = async (app, title, message) => {
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
    console.error("Alert error:", err);
  }
};

// 📌 GET ALL WAGONS
exports.getAllWagons = async (req, res) => {
  try {
    const wagons = await Wagon.find().sort({ wagonNumber: 1 });
    return res.json(wagons);
  } catch (error) {
    console.error("Fetch wagons error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 CREATE WAGON (Admin Only)
exports.createWagon = async (req, res) => {
  try {
    const { wagonNumber, wagonType, capacity, status, currentStation } = req.body;

    if (!wagonNumber || !wagonType || !capacity || !currentStation) {
      return res.status(400).json({ error: "Wagon number, type, capacity, and current station are required." });
    }

    const exists = await Wagon.findOne({ wagonNumber: wagonNumber.toUpperCase() });
    if (exists) {
      return res.status(400).json({ error: "Wagon already exists with this number." });
    }

    const wagon = await Wagon.create({
      wagonNumber: wagonNumber.toUpperCase(),
      wagonType,
      capacity: Number(capacity),
      status: status || "Available",
      currentStation: currentStation.toUpperCase()
    });

    await AuditLog.create({
      action: `Added wagon ${wagon.wagonNumber}`,
      user: req.user.email
    });

    return res.status(201).json({ message: "Wagon added successfully", wagon });
  } catch (error) {
    console.error("Create wagon error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 UPDATE WAGON (Admin Only)
exports.updateWagon = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentStation, wagonType, capacity } = req.body;

    const wagon = await Wagon.findOne({ wagonNumber: id.toUpperCase() });
    if (!wagon) {
      return res.status(404).json({ error: "Wagon not found." });
    }

    if (status) wagon.status = status;
    if (currentStation) wagon.currentStation = currentStation.toUpperCase();
    if (wagonType) wagon.wagonType = wagonType;
    if (capacity) wagon.capacity = Number(capacity);

    await wagon.save();

    await AuditLog.create({
      action: `Updated wagon ${wagon.wagonNumber} parameters`,
      user: req.user.email
    });

    return res.json({ message: "Wagon updated successfully", wagon });
  } catch (error) {
    console.error("Update wagon error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 DELETE WAGON (Admin Only)
exports.deleteWagon = async (req, res) => {
  try {
    const { id } = req.params;
    const wagon = await Wagon.findOne({ wagonNumber: id.toUpperCase() });

    if (!wagon) {
      return res.status(404).json({ error: "Wagon not found." });
    }

    await Wagon.deleteOne({ wagonNumber: id.toUpperCase() });

    await AuditLog.create({
      action: `Removed wagon ${id}`,
      user: req.user.email
    });

    return res.json({ message: "Wagon deleted successfully." });
  } catch (error) {
    console.error("Delete wagon error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 ALLOCATE WAGONS TO A BOOKING
exports.allocateWagons = async (req, res) => {
  try {
    const { bookingId, wagonNumbers } = req.body;

    if (!bookingId || !wagonNumbers || !Array.isArray(wagonNumbers) || wagonNumbers.length === 0) {
      return res.status(400).json({ error: "Booking ID and list of wagon numbers are required." });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    // Verify all specified wagons exist and are available
    const wagons = await Wagon.find({ wagonNumber: { $in: wagonNumbers.map(w => w.toUpperCase()) } });
    if (wagons.length !== wagonNumbers.length) {
      return res.status(400).json({ error: "Some specified wagons do not exist." });
    }

    // Mark wagons as Allocated
    await Wagon.updateMany(
      { wagonNumber: { $in: wagonNumbers.map(w => w.toUpperCase()) } },
      { status: "Allocated", bookingId: bookingId }
    );

    // Update booking status
    booking.bookingStatus = "Wagon Allocated";
    booking.wagonCount = wagonNumbers.length;
    await booking.save();

    // Trigger Notification for the Customer
    const customerNotification = await Notification.create({
      userId: booking.customerId,
      title: "Wagons Allocated 🚆",
      message: `Your booking ${booking.bookingId} has been allocated ${wagonNumbers.length} wagons. Status updated to: Wagon Allocated.`,
      status: "unread"
    });

    const io = req.app.get("socketio");
    if (io) {
      io.emit("notification", customerNotification);
    }

    await AuditLog.create({
      action: `Allocated ${wagonNumbers.length} wagons to Booking ${bookingId}`,
      user: req.user.email
    });

    return res.json({
      message: "Wagons successfully allocated and booking status updated.",
      booking
    });
  } catch (error) {
    console.error("Wagon allocation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 RELEASE WAGONS
exports.releaseWagons = async (req, res) => {
  try {
    const { wagonNumbers, stationCode } = req.body;

    if (!wagonNumbers || !Array.isArray(wagonNumbers) || wagonNumbers.length === 0) {
      return res.status(400).json({ error: "Wagon numbers list is required." });
    }

    // Release wagons and optionally update current station
    const updateFields = { status: "Available", bookingId: null };
    if (stationCode) updateFields.currentStation = stationCode.toUpperCase();

    await Wagon.updateMany(
      { wagonNumber: { $in: wagonNumbers.map(w => w.toUpperCase()) } },
      updateFields
    );

    await AuditLog.create({
      action: `Released wagons: ${wagonNumbers.join(", ")}`,
      user: req.user.email
    });

    return res.json({ message: "Wagons successfully released to available inventory." });
  } catch (error) {
    console.error("Release wagons error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 AI RECOMMENDATION FOR BOOKING WAGON ALLOCATION
exports.getRecommendation = async (req, res) => {
  try {
    const { bookingId } = req.query;
    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required." });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    // Determine target Wagon Type based on Cargo
    let targetType = "BCN"; // Covered for Cement, grain, fertilizers
    const cargoLower = booking.cargoType.toLowerCase();

    if (cargoLower.includes("coal") || cargoLower.includes("ore") || cargoLower.includes("mineral") || cargoLower.includes("sand")) {
      targetType = "BOXN"; // Open
    } else if (cargoLower.includes("steel") || cargoLower.includes("rail") || cargoLower.includes("iron") || cargoLower.includes("machine") || cargoLower.includes("container")) {
      targetType = "BRN"; // Flat
    }

    // Find available wagons of target type
    let availableWagons = await Wagon.find({
      status: "Available",
      wagonType: targetType
    });

    // Heuristics: Prioritize wagons currently at the booking's sourceStation!
    availableWagons.sort((a, b) => {
      if (a.currentStation === booking.sourceStation && b.currentStation !== booking.sourceStation) return -1;
      if (a.currentStation !== booking.sourceStation && b.currentStation === booking.sourceStation) return 1;
      return 0;
    });

    // Calculate required capacity
    let totalCap = 0;
    const recommended = [];
    const neededTons = booking.weight;

    for (const wagon of availableWagons) {
      if (totalCap >= neededTons) break;
      recommended.push(wagon);
      totalCap += wagon.capacity;
    }

    const shortage = totalCap < neededTons;

    // Trigger shortage alert if needed
    if (shortage) {
      await sendAlert(
        req.app,
        "Wagon Shortage Alert ⚠️",
        `Shortage detected! Booking ${bookingId} requires ${neededTons} tons of capacity, but only ${totalCap} tons of ${targetType} wagons are available.`
      );
    }

    return res.json({
      cargoType: booking.cargoType,
      recommendedType: targetType,
      requiredWeight: neededTons,
      suggestedCapacity: totalCap,
      shortage,
      recommendedWagons: recommended.map(w => ({
        wagonNumber: w.wagonNumber,
        wagonType: w.wagonType,
        capacity: w.capacity,
        currentStation: w.currentStation,
        isAtSource: w.currentStation === booking.sourceStation
      }))
    });
  } catch (error) {
    console.error("AI Wagon Recommendation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
