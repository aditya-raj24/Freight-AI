const mongoose = require("mongoose");

const StationSchema = new mongoose.Schema({
  stationCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  stationName: {
    type: String,
    required: true,
    trim: true
  },
  congestionLevel: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  waitingTrains: {
    type: Number,
    required: true,
    default: 0
  },
  availableTracks: {
    type: Number,
    required: true,
    default: 2
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
});

module.exports = mongoose.model("Station", StationSchema);
