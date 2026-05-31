const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sourceStation: {
    type: String,
    required: true,
    trim: true
  },
  destinationStation: {
    type: String,
    required: true,
    trim: true
  },
  cargoType: {
    type: String,
    required: true,
    trim: true
  },
  weight: {
    type: Number,
    required: true
  },
  wagonCount: {
    type: Number,
    required: true,
    default: 1
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Low"
  },
  bookingStatus: {
    type: String,
    enum: [
      "Draft",
      "Submitted",
      "Under Review",
      "Approved",
      "Wagon Allocated",
      "Train Scheduled",
      "In Transit",
      "Delivered"
    ],
    default: "Submitted"
  },
  estimatedArrival: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Booking", BookingSchema);
