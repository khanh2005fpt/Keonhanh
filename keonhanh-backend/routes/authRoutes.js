import express from "express";
import User from "../models/User.js";

const router = express.Router();
router.post("/login", async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const password = req.body.password;
    if (!username || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập username và mật khẩu",
      });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Username không tồn tại" });
    }
    const isMatch = user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không chính xác" });
    }

    return res.status(200).json({
      message: "Đăng nhập thành công",
      user: {
        id: user._id.toString(),
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Không thể đăng nhập" });
  }
});
router.post("/register", async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const password = req.body.password;

    if (!username || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập username và mật khẩu",
      });
    }

    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username phải có ít nhất 3 ký tự" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({ message: "Username đã tồn tại" });
    }

    const user = await User.create({
      username,
      password: User.hashPassword(password),
    });

    return res.status(201).json({
      message: "Đăng ký tài khoản thành công",
      user: {
        id: user._id.toString(),
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Đăng ký tài khoản thất bại:", error);

    if (error.code === 11000) {
      return res.status(409).json({ message: "Username đã tồn tại" });
    }

    return res.status(500).json({ message: "Không thể đăng ký tài khoản" });
  }
});

export default router;
