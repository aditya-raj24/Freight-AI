const mongoose = require("mongoose");

const OfficerIdSchema = new mongoose.Schema({
  govId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isUsed: {
    type: Boolean,
    required: true,
    default: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("OfficerId", OfficerIdSchema);
