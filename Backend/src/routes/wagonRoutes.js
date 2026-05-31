const express = require("express");
const router = express.Router();
const wagonController = require("../controllers/wagonController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.get("/", protect, wagonController.getAllWagons);
router.post("/", protect, requireRole(["officer"]), wagonController.createWagon);
router.put("/:id", protect, requireRole(["officer"]), wagonController.updateWagon);
router.delete("/:id", protect, requireRole(["officer"]), wagonController.deleteWagon);

// Control Room operations
router.post("/allocate", protect, requireRole(["officer"]), wagonController.allocateWagons);
router.post("/release", protect, requireRole(["officer"]), wagonController.releaseWagons);
router.get("/recommendation", protect, requireRole(["officer"]), wagonController.getRecommendation);

module.exports = router;
