const User = require("../models/user");
const OfficerId = require("../models/officerId");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");
const { sendRegistrationEmail, sendResetPasswordEmail } = require("../services/emailService");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });
};

// 📌 REGISTER USER
exports.register = async (req, res) => {
  try {
    const { name, email, password, govId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please provide name, email, and password." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    let role = "customer";
    let matchedGovIdDoc = null;

    if (govId && govId.trim()) {
      const trimmedGovId = govId.trim().toUpperCase();
      matchedGovIdDoc = await OfficerId.findOne({ govId: trimmedGovId });
      
      if (!matchedGovIdDoc) {
        return res.status(400).json({ error: "Invalid Government Officer ID." });
      }
      
      if (matchedGovIdDoc.isUsed) {
        return res.status(400).json({ error: "This Government Officer ID has already been registered." });
      }
      
      role = "officer";
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      govId: matchedGovIdDoc ? matchedGovIdDoc.govId : null
    });

    if (matchedGovIdDoc) {
      matchedGovIdDoc.isUsed = true;
      matchedGovIdDoc.assignedTo = user._id;
      await matchedGovIdDoc.save();
    }

    // Dispatch email notification asynchronously
    sendRegistrationEmail(user.email, user.name, user.role, user.govId).catch(err => {
      console.error("Email service error:", err);
    });

    return res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        govId: user.govId
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Server error during registration." });
  }
};

// 📌 LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter email and password." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error during login." });
  }
};

// 📌 GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ error: "Server error retrieving profile." });
  }
};

// 📌 FORGOT PASSWORD (OTP BASED)
exports.forgotPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Please provide your email address." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No user found with this email." });
    }

    // Phase 1: Request OTP
    if (!otp) {
      // Generate a 6-digit random code
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetOtp = generatedOtp;
      user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
      await user.save();

      // Send the OTP email asynchronously
      sendResetPasswordEmail(user.email, user.name, generatedOtp).catch(err => {
        console.error("Failed to send OTP email:", err);
      });

      return res.json({ 
        otpSent: true, 
        message: "A 6-digit verification code (OTP) has been dispatched to your email." 
      });
    }

    // Phase 2: Verify OTP & Reset Password
    if (!newPassword) {
      return res.status(400).json({ error: "Please enter your new password." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    if (!user.resetOtp || user.resetOtp !== otp.trim() || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP code." });
    }

    // Update password (pre-save hook will hash it automatically)
    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    return res.json({ message: "Your password has been reset successfully. You can now login." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Server error during password reset." });
  }
};

// 📌 GET ALL USERS (Admin Only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ error: "Server error retrieving users list." });
  }
};
