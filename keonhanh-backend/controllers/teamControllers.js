import mongoose from "mongoose";
import Team from "../models/Team.js";
import UserProfile from "../models/UserProfile.js";

export const createTeam = async (req, res) => {
  try {
    const {
      name,
      logo = "",
      captainId,
      players = [],
      location,
      skillLevel = "Sơ cấp",
      isRecruiting = true,
    } = req.body;

    if (!name?.trim() || !captainId || !location?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin.",
      });
    }

    if (!Array.isArray(players)) {
      return res.status(400).json({
        success: false,
        message: "Danh sách cầu thủ không hợp lệ.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(captainId)) {
      return res.status(400).json({
        success: false,
        message: "CaptainId không hợp lệ.",
      });
    }

    if (name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Tên đội phải có ít nhất 3 ký tự.",
      });
    }

    const validSkillLevels = ["Sơ cấp", "Trung cấp", "Chuyên nghiệp"];

    if (!validSkillLevels.includes(skillLevel)) {
      return res.status(400).json({
        success: false,
        message: "Trình độ không hợp lệ.",
      });
    }

    const existedName = await Team.findOne({ name: name.trim() });

    if (existedName) {
      return res.status(400).json({
        success: false,
        message: "Tên đội đã tồn tại.",
      });
    }

    const captainTeam = await Team.findOne({ captainId });

    if (captainTeam) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã là đội trưởng của một đội.",
      });
    }

    const captainProfile = await UserProfile.findOne({
      userId: captainId,
    });

    if (!captainProfile) {
      return res.status(404).json({
        success: false,
        message: "Bạn chưa tạo hồ sơ cầu thủ.",
      });
    }

    const joinedTeam = await Team.findOne({
      players: captainProfile._id,
    });

    if (joinedTeam) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã thuộc một đội khác.",
      });
    }

    const allPlayerIds = [
      ...new Set([captainProfile._id.toString(), ...players]),
    ];

    for (const id of allPlayerIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `PlayerId không hợp lệ: ${id}`,
        });
      }
    }

    const profiles = await UserProfile.find({
      _id: { $in: allPlayerIds },
    });

    if (profiles.length !== allPlayerIds.length) {
      return res.status(404).json({
        success: false,
        message: "Có cầu thủ chưa tạo hồ sơ.",
      });
    }

    const teamContainsPlayers = await Team.findOne({
      players: { $in: allPlayerIds },
    }).populate("players", "fullName");

    if (teamContainsPlayers) {
      const takenPlayers = profiles
        .filter((profile) =>
          teamContainsPlayers.players.some(
            (p) => p._id.toString() === profile._id.toString()
          )
        )
        .map((p) => p.fullName);

      return res.status(400).json({
        success: false,
        message: `Các cầu thủ sau đã thuộc đội khác: ${takenPlayers.join(", ")}`,
      });
    }

    const newTeam = await Team.create({
      name: name.trim(),
      logo,
      captainId,
      players: allPlayerIds,
      location: location.trim(),
      skillLevel,
      isRecruiting,
      recruitingStatus: isRecruiting ? "Searching" : "Full",
    });

    const teamData = await Team.findById(newTeam._id)
      .populate("captainId", "username")
      .populate("players", "fullName position avatar location phone");

    return res.status(201).json({
      success: true,
      message: "Tạo đội bóng thành công.",
      data: teamData,
    });
  } catch (err) {
    console.error("CREATE TEAM ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Không thể tạo đội bóng.",
    });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đội",
      });
    }

    await Team.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Xóa đội thành công",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("captainId", "username")
      .populate("players", "fullName position avatar");

    return res.json({
      success: true,
      data: teams,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id)
      .populate("captainId", "username")
      .populate("players", "fullName position avatar location phone");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đội",
      });
    }

    return res.json({
      success: true,
      data: team,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getMyTeam = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ cầu thủ",
      });
    }

    const team = await Team.findOne({
      $or: [
        { captainId: userId },
        { players: profile._id },
      ],
    })
      .populate("captainId", "username")
      .populate(
        "players",
        "fullName position avatar location phone"
      );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Bạn chưa có đội",
      });
    }

    return res.json({
      success: true,
      data: team,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};