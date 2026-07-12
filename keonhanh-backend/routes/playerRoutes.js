import express from "express";
import UserProfile from "../models/UserProfile.js";
import Team from "../models/Team.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const teams = await Team.find();
    const playersInTeamIds = [];
    const captainUserIds = [];

    teams.forEach(team => {
        playersInTeamIds.push(...team.players.map(p => p.toString()));
        captainUserIds.push(team.captainId.toString());
    });

    const allProfiles = await UserProfile.find().populate("userId", "role");
    
    // Chỉ lấy những cầu thủ chưa thuộc đội nào (chưa phải là thành viên, cũng chưa làm đội trưởng)
    const availablePlayers = allProfiles.filter(profile => {
      const isPlayer = playersInTeamIds.includes(profile._id.toString());
      const isCaptain = profile.userId && captainUserIds.includes(profile.userId._id.toString());
      return !isPlayer && !isCaptain;
    });

    res.status(200).json({
       players: availablePlayers
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;