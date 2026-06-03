const mongoose = require("mongoose");

const WagonSchema = new mongoose.Schema({
  wagonNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  wagonType: {
    type: String,
    enum: ["BOXN", "BCN", "BRN"], // BOXN = Open coal/ore, BCN = Covered grain/cement, BRN = Flat rails/steel
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["Available", "Allocated", "Maintenance"],
    default: "Available"
  },
  currentStation: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  bookingId: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model("Wagon", WagonSchema);
