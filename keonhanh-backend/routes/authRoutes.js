import express from "express";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import Team from "../models/Team.js";

const router = express.Router();

/**
 * =========================
 * LOGIN
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

    if (!user.isValidPassword(password)) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không chính xác",
      });
    }

    const profile = await 
    UserProfile.findOne({ 
      userId: user._id, 
    }); 
    let team = null; 
    if (profile) { 
      team = await Team.findOne({ 
        $or: [ 
          { captainId: user._id }, 
          { players: profile._id }, 
        ], 
      }); 
    }

    return res.json({
        success:true,

        user:{
            _id:user._id,
            username:user.username,
            role:user.role,

            profileId: profile?._id || null,

            teamId: team?._id || null,
        },

        profile,
        team
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Không thể đăng nhập",
    });
  }
});

/**
 * =========================
 * REGISTER
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

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username đã tồn tại",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Không thể đăng ký tài khoản",
    });
  }
});

export default router;