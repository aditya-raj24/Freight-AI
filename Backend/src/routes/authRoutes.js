const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Authentication paths
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.get("/profile", protect, authController.getProfile);
router.get("/users", protect, requireRole(["officer"]), authController.getAllUsers);

module.exports = router;
