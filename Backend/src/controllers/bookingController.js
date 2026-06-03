const Booking = require("../models/booking");
const Notification = require("../models/notification");
const AuditLog = require("../models/auditLog");
const Wagon = require("../models/wagon");
const { sendBookingEmail, sendBookingStatusUpdateEmail } = require("../services/emailService");

// Helper to broadcast notification via Socket.IO and save to DB
const createAndSendNotification = async (app, userId, title, message) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      status: "unread"
    });
    
    const io = app.get("socketio");
    if (io) {
      io.emit("notification", notification);
    }
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// Helper to write audit logs
const writeAuditLog = async (action, user) => {
  try {
    await AuditLog.create({ action, user });
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
};

// 📌 CREATE BOOKING (Customer)
exports.bookWagon = async (req, res) => {
  try {
    const { sourceStation, destinationStation, cargoType, weight, priority } = req.body;

    if (!sourceStation || !destinationStation || !cargoType || !weight) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    const count = await Booking.countDocuments();
    const bookingId = "BK" + (1001 + count);

    // Auto-calculate wagon count based on cargo type capacity (e.g. 50 tons per wagon)
    const wagonCount = Math.ceil(Number(weight) / 50) || 1;

    // Default status is Submitted
    const newBooking = await Booking.create({
      bookingId,
      customerId: req.user.id,
      sourceStation,
      destinationStation,
      cargoType,
      weight: Number(weight),
      wagonCount,
      priority: req.user.role === "officer" ? (priority || "Low") : "Low",
      bookingStatus: "Submitted",
      estimatedArrival: new Date(Date.now() + 48 * 60 * 60 * 1000) // Default 48 hours ETA
    });

    // Notify customer
    await createAndSendNotification(
      req.app,
      req.user.id,
      "Booking Submitted",
      `Your booking ${bookingId} has been successfully submitted and is under review.`
    );

    // Notify control room officers (broadcast)
    await createAndSendNotification(
      req.app,
      null,
      "New Booking Request",
      `A new booking ${bookingId} for ${weight} tons of ${cargoType} requires review.`
    );

    await writeAuditLog(`Created booking ${bookingId}`, req.user.email);

    // Send email notification to user asynchronously
    sendBookingEmail(req.user.email, req.user.name, newBooking).catch(err => {
      console.error("Booking email service error:", err);
    });

    return res.status(201).json({
      message: "Booking submitted successfully",
      booking: newBooking
    });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 GET ALL BOOKINGS (Filtered by User Role)
exports.getAllBookings = async (req, res) => {
  try {
    let query = {};
    
    // Customers can only see their own bookings
    if (req.user.role === "customer") {
      query.customerId = req.user.id;
    }

    const bookings = await Booking.find(query)
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      total: bookings.length,
      bookings
    });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 GET SINGLE BOOKING
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findOne({ bookingId: id }).populate("customerId", "name email");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    // Customers can only access their own bookings
    if (req.user.role === "customer" && booking.customerId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied. This booking does not belong to you." });
    }

    return res.json(booking);
  } catch (error) {
    console.error("Fetch booking by ID error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 UPDATE BOOKING STATUS / ASSIGNMENTS
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingStatus, priority, estimatedArrival, wagonCount } = req.body;

    const booking = await Booking.findOne({ bookingId: id }).populate("customerId", "name email");
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    // Access control: Customer can only update their own bookings
    if (req.user.role === "customer" && booking.customerId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You do not own this booking." });
    }

    const oldStatus = booking.bookingStatus;

    // Enforce officer-only priority updates
    if (priority && priority !== booking.priority) {
      if (req.user.role !== "officer") {
        return res.status(403).json({ error: "Access denied. Only officers can set or modify booking priority." });
      }
      booking.priority = priority;
    }

    if (bookingStatus) booking.bookingStatus = bookingStatus;
    if (estimatedArrival) booking.estimatedArrival = estimatedArrival;
    if (wagonCount) booking.wagonCount = wagonCount;

    await booking.save();

    // Auto-release associated wagons when booking status becomes "Delivered" or "Declined"
    if (bookingStatus && oldStatus !== bookingStatus) {
      if (bookingStatus === "Delivered") {
        const allocatedWagons = await Wagon.find({ bookingId: booking.bookingId });
        if (allocatedWagons.length > 0) {
          await Wagon.updateMany(
            { bookingId: booking.bookingId },
            { 
              status: "Available", 
              bookingId: null, 
              currentStation: booking.destinationStation.toUpperCase() 
            }
          );
          const wagonNumbersStr = allocatedWagons.map(w => w.wagonNumber).join(", ");
          await writeAuditLog(
            `Auto-released wagons (${wagonNumbersStr}) for Delivered booking ${booking.bookingId} at ${booking.destinationStation}`,
            req.user.email
          );

          // Broadcast notification about wagon release
          await createAndSendNotification(
            req.app,
            null, // Broadcast to all
            "Wagons Released 🟢",
            `Wagons ${wagonNumbersStr} have been released at ${booking.destinationStation} following delivery of booking ${booking.bookingId}.`
          );
        }
      } else if (bookingStatus === "Declined") {
        const allocatedWagons = await Wagon.find({ bookingId: booking.bookingId });
        if (allocatedWagons.length > 0) {
          await Wagon.updateMany(
            { bookingId: booking.bookingId },
            { 
              status: "Available", 
              bookingId: null 
            }
          );
          const wagonNumbersStr = allocatedWagons.map(w => w.wagonNumber).join(", ");
          await writeAuditLog(
            `Released wagons (${wagonNumbersStr}) due to Declined booking ${booking.bookingId}`,
            req.user.email
          );

          // Broadcast notification about wagon release
          await createAndSendNotification(
            req.app,
            null, // Broadcast to all
            "Wagons Released (Decline) 🟢",
            `Wagons ${wagonNumbersStr} have been released following decline of booking ${booking.bookingId}.`
          );
        }
      }
    }

    // Trigger real-time notifications on status update
    if (bookingStatus && oldStatus !== bookingStatus) {
      await createAndSendNotification(
        req.app,
        booking.customerId._id,
        "Booking Status Updated",
        `Booking ${booking.bookingId} is now: ${bookingStatus}.`
      );
      
      // Send email status update asynchronously
      sendBookingStatusUpdateEmail(booking.customerId.email, booking.customerId.name, booking).catch(err => {
        console.error("Booking status update email error:", err);
      });
      
      // Log it
      await writeAuditLog(`Updated booking ${booking.bookingId} status to '${bookingStatus}'`, req.user.email);
    } else {
      await writeAuditLog(`Modified booking ${booking.bookingId} fields`, req.user.email);
    }

    return res.json({
      message: "Booking updated successfully",
      booking
    });
  } catch (error) {
    console.error("Update booking error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 DELETE/CANCEL BOOKING
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({ bookingId: id });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    // Role check: Customer can cancel only in "Submitted" or "Draft" status
    if (req.user.role === "customer") {
      if (booking.customerId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Access denied." });
      }
      if (!["Draft", "Submitted"].includes(booking.bookingStatus)) {
        return res.status(400).json({ error: "Booking cannot be cancelled once it is approved or in transit." });
      }
    }

    // Free any allocated wagons before deleting the booking
    await Wagon.updateMany({ bookingId: id }, { status: "Available", bookingId: null });

    await Booking.deleteOne({ bookingId: id });

    await writeAuditLog(`Cancelled booking ${id}`, req.user.email);

    return res.json({ message: `Booking ${id} was successfully cancelled.` });
  } catch (error) {
    console.error("Delete booking error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
