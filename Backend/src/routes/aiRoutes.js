const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// AI predictions endpoints
router.post("/predict-and-schedule", protect, aiController.predictAndSchedule);
router.get("/sample-data", aiController.getSampleData);
router.get("/model-info", aiController.getModelInfo);
router.get("/history", protect, aiController.getPredictionHistory);

// Legacy endpoint for backward compatibility with basic views
router.get("/stations", async (req, res) => {
  try {
    const Station = require("../models/station");
    const stations = await Station.find();
    const map = {};
    stations.forEach(s => {
      map[s.stationCode] = { 
        name: s.stationName, 
        city: s.stationName, 
        zone: s.stationCode,
        location: s.location
      };
    });
    return res.json(map);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load stations" });
  }
});

module.exports = router;
