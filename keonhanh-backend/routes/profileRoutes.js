import express from "express";
import mongoose from "mongoose";

import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";

const router = express.Router();


router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "UserId khong hop le" });
    }

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: "Khong tim thay profile" });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ message: "Khong the lay profile" });
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
        .json({ message: "Vui long nhap day du thong tin profile" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "UserId khong hop le" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Khong tim thay user" });
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
      message: "Cap nhat profile thanh cong",
      profile,
    });
  } catch (error) {
    return res.status(500).json({ message: "Khong the cap nhat profile" });
  }
});

export default router;
