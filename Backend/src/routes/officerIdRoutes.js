const express = require("express");
const router = express.Router();
const officerIdController = require("../controllers/officerIdController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// All routes are protected and restricted to control room officers
router.get("/", protect, requireRole(["officer"]), officerIdController.getAllOfficerIds);
router.post("/", protect, requireRole(["officer"]), officerIdController.createOfficerId);
router.delete("/:id", protect, requireRole(["officer"]), officerIdController.deleteOfficerId);

module.exports = router;
