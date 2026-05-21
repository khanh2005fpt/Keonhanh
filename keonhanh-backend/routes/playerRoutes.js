import express from "express";
import UserProfile from "../models/UserProfile.js";

const router = express.Router();

/*
GET /api/players
Lấy danh sách cầu thủ
*/



router.get("/", async (req, res) => {
  try {
    const players = await UserProfile.find()
      .populate("userId", "role -_id")

    res.status(200).json({
       players
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;