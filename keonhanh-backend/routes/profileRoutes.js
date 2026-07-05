import express from "express";
import mongoose from "mongoose";

import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "UserId không hợp lệ",
      });
    }

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy profile",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
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
      isLookingForTeam = true,
    } = req.body;

    if (
      !userId ||
      !phone ||
      !fullName ||
      !position ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "UserId không hợp lệ.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user.",
      });
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
        isLookingForTeam,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({
      success: true,
      message: "Lưu hồ sơ thành công.",
      profile,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.put("/:profileId", async (req, res) => {
  try {
    const { profileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).json({
        success: false,
        message: "ProfileId không hợp lệ.",
      });
    }

    const profile = await UserProfile.findByIdAndUpdate(
      profileId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy profile.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật thành công.",
      profile,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get("/profile/:profileId", async (req, res) => {
  try {
    const { profileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).json({
        success: false,
        message: "ProfileId không hợp lệ.",
      });
    }

    const profile = await UserProfile.findById(profileId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy profile.",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;