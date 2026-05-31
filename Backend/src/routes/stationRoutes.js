const express = require("express");
const router = express.Router();
const stationController = require("../controllers/stationController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.get("/", protect, stationController.getAllStations);
router.post("/", protect, requireRole(["officer"]), stationController.createStation);
router.put("/:id", protect, requireRole(["officer"]), stationController.updateStation);
router.delete("/:id", protect, requireRole(["officer"]), stationController.deleteStation);

module.exports = router;
