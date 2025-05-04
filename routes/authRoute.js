const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const UserModel = require("../models/UserModel");
const { auth } = require("../middlewares/auth");
const bcrypt = require("bcrypt");

// Health check endpoint
router.get("/check", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
});

// Register a new user
router.post(
  "/register",
  [
    body("username").trim().isLength({ min: 3 }).escape(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["admin", "operator"]),
  ],
  async (req, res) => {
    try {
      console.log("Registration attempt:", req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, role } = req.body;

      // Check if user already exists
      let user = await UserModel.findOne({ $or: [{ email }, { username }] });
      if (user) {
        console.log("User already exists:", { email, username });
        return res.status(400).json({ message: "User already exists" });
      }

      // Create new user
      user = new UserModel({
        username,
        email,
        password,
        role: role || "operator",
      });

      console.log("Saving new user:", { username, email, role });
      await user.save();
      console.log("User saved successfully");

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id,
          role: user.role 
        }, 
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
        }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        message: "Register Successfully",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Login user
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user exists
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { 
          userId: user._id,
          role: user.role 
        }, 
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
        }
      );

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        message: "Login Successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router; 