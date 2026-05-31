const express = require("express");
const router = express.Router();
const demoController = require("../controllers/demoController");
const { protect } = require("../middleware/authMiddleware");

// Demo endpoints require authentication
router.use(protect);

router.post("/rain", demoController.triggerHeavyRainfall);
router.post("/congestion", demoController.triggerHeavyCongestion);
router.post("/shortage", demoController.triggerWagonShortage);
router.post("/rush", demoController.triggerFestivalRush);
router.post("/coal", demoController.triggerCoalPriority);

module.exports = router;
