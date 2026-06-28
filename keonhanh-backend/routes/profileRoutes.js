import express from "express";
import mongoose from "mongoose";

import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "UserId không hợp lệ" });
    }

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: "Không tìm thấy profile" });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ message: "Không thể lấy profile" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      userId,
      phone,
      avatar = "",
      fullName,
      position,
      location,
    } = req.body;

    if (!userId || !phone || !fullName || !position || !location) {
      return res
        .status(400)
        .json({
          message:
            "Vui lòng nhập đầy đủ thông tin profile",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "UserId không hợp lệ" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        phone: phone.trim(),
        avatar: avatar.trim(),
        fullName: fullName.trim(),
        position: position.trim(),
        location: location.trim(),
        isLookingForTeam: true,
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      },
    );

    return res.status(201).json({
      message: "Cập nhật profile thành công",
      profile,
    });
  } catch (error) {
    return res.status(500).json({ message: "Không thể cập nhật profile" });
  }
});

export default router;
