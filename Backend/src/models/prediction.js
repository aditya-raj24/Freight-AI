const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true
  },
  predictedDelay: {
    type: Number,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    default: 85
  },
  factors: {
    congestion: { type: Number, default: 35 },
    weather: { type: Number, default: 20 },
    wagonCount: { type: Number, default: 15 },
    weight: { type: Number, default: 10 },
    distance: { type: Number, default: 10 },
    locomotivePower: { type: Number, default: 10 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Prediction", PredictionSchema);
