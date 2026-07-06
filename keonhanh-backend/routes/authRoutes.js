import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import Team from "../models/Team.js";

const router = express.Router();

/**
 * =========================
 * LOGIN (FIXED FINAL)
 * =========================
 */
router.post("/login", async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const password = req.body.password;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập username và mật khẩu",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Username không tồn tại",
      });
    }

    console.log("DB PASSWORD:", user.password);
    console.log("TYPE:", typeof user.password);

    // =========================
    // PASSWORD CHECK SAFE
    // =========================
    let isMatch = false;

    try {
      const dbPass = user.password;
      console.log("[STEP 1] dbPass type:", typeof dbPass);
      console.log("[STEP 2] dbPass has ':':", dbPass.includes(":"));

      if (typeof dbPass !== "string") {
        console.log("[STEP 3] FAIL: not a string");
        isMatch = false;
      }

      // CASE 1: crypto format salt:hash
      else if (dbPass.includes(":")) {
        const [salt, storedHash] = dbPass.split(":");
        console.log("[STEP 3] salt length:", salt.length, "storedHash length:", storedHash.length);

        const hash = crypto
          .scryptSync(password, salt, 64)
          .toString("hex");

        console.log("[STEP 4] computed hash:", hash);
        console.log("[STEP 5] stored hash:", storedHash);
        isMatch = hash === storedHash;
        console.log("[STEP 6] isMatch:", isMatch);
      }

      // CASE 2: fallback plain text (phòng dữ liệu cũ)
      else {
        isMatch = dbPass === password;
        console.log("[STEP 3] plain text match:", isMatch);
      }

    } catch (err) {
      console.error("PASSWORD ERROR:", err);
      isMatch = false;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không chính xác",
      });
    }

    const profile = await UserProfile.findOne({
      userId: user._id,
    });

    let team = null;

    if (profile) {
      team = await Team.findOne({
        $or: [
          { captainId: user._id },
          { players: user._id },
        ],
      });
    }

    // =========================
    // JWT TOKEN
    // =========================
    console.log("[STEP 7] JWT_SECRET exists:", !!process.env.JWT_SECRET);
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("[STEP 8] token created OK");

    return res.json({
      success: true,
      token,

      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        userId: user._id,
        teamId: team?._id || null,
      },

      profile,
      team,
    });

  } catch (err) {
    console.error("LOGIN ERROR name:", err.name);
    console.error("LOGIN ERROR message:", err.message);
    console.error("LOGIN ERROR stack:", err.stack);

    return res.status(500).json({
      success: false,
      message: "Không thể đăng nhập",
    });
  }
});

/**
 * =========================
 * REGISTER (GIỮ NGUYÊN)
 * =========================
 */
router.post("/register", async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const password = req.body.password;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập username và mật khẩu",
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username phải có ít nhất 3 ký tự",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const existed = await User.findOne({ username });

    if (existed) {
      return res.status(409).json({
        success: false,
        message: "Username đã tồn tại",
      });
    }

    const newUser = await User.create({
      username,
      password: User.hashPassword(password),
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      user: {
        _id: newUser._id.toString(),
        username: newUser.username,
        role: newUser.role,
        teamId: null,
      },
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Không thể đăng ký tài khoản",
    });
  }
});

export default router;