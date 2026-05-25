import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const password = req.body.password;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Vui long nhap username va mat khau" });
    }

    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username phai co it nhat 3 ky tu" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mat khau phai co it nhat 6 ky tu" });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({ message: "Username da ton tai" });
    }

    const user = await User.create({
      username,
      password: User.hashPassword(password),
    });

    return res.status(201).json({
      message: "Dang ky tai khoan thanh cong",
      user: {
        id: user._id.toString(),
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Register failed:", error);

    if (error.code === 11000) {
      return res.status(409).json({ message: "Username da ton tai" });
    }

    return res.status(500).json({ message: "Khong the dang ky tai khoan" });
  }
});

export default router;
