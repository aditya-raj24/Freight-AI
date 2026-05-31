const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.get("/", protect, requireRole(["officer"]), analyticsController.getAnalytics);
router.get("/audit-logs", protect, requireRole(["officer"]), analyticsController.getAuditLogs);

module.exports = router;
