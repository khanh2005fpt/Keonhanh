import Invitation from "../models/Invitation.js";
import UserProfile from "../models/UserProfile.js";
import Team from "../models/Team.js";

// =========================
// CREATE INVITATION
// =========================
export const createInvitation = async (req, res) => {
  try {
    const { playerProfileId } = req.body;
    const currentUserId = req.user.id;

    const myProfile = await UserProfile.findOne({ userId: currentUserId });
    if (!myProfile) {
      return res.status(404).json({ success: false, message: "Hồ sơ của bạn không tồn tại." });
    }

    // Tìm đội mà user này là đội trưởng
    let team = await Team.findOne({ captainId: currentUserId });

    if (!team) {
      // Tìm xem user có nằm trong đội nào không
      const teamAsMember = await Team.findOne({ players: myProfile._id });
      if (teamAsMember) {
        return res.status(403).json({ success: false, message: "Chỉ đội trưởng mới có quyền mời thành viên." });
      } else {
        return res.status(400).json({ success: false, message: "Bạn chưa có đội." });
      }
    }

    const teamId = team._id;
    const captainId = currentUserId;

    const profile = await UserProfile.findById(playerProfileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ cầu thủ.",
      });
    }

    // check đã trong team chưa (đúng chuẩn là profile._id)
    const alreadyInTeam = team.players
      .map(String)
      .includes(String(profile._id));

    if (alreadyInTeam) {
      return res.status(400).json({
        success: false,
        message: "Cầu thủ đã ở trong đội.",
      });
    }

    // check đã invite chưa (theo userId)
    const existing = await Invitation.findOne({
      teamId,
      userId: profile.userId,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Cầu thủ này đã được mời rồi.",
      });
    }

    const invitation = await Invitation.create({
      teamId,
      captainId,
      userId: profile.userId,
      status: "pending",
    });

    return res.json({
      success: true,
      message: "Đã gửi lời mời thành công!",
      data: invitation,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// GET MY INVITATIONS
// =========================
export const getMyInvitations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const invitations = await Invitation.find({
      userId,
      status: "pending",
    })
      .populate("teamId", "name logo location")
      .populate("captainId", "username");

    return res.json({
      success: true,
      data: invitations,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// ACCEPT INVITATION
// =========================
export const acceptInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({ success: false });
    }

    const team = await Team.findById(invitation.teamId);
    if (!team) {
      return res.status(404).json({ success: false });
    }

    // 🔥 LẤY PROFILE CHÍNH XÁC
    const profile = await UserProfile.findOne({
      userId: invitation.userId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy profile",
      });
    }

    // 🔥 FIX: đảm bảo không null + đúng type
    team.players = team.players.filter(p => p); // xoá null rác

    const exists = team.players.some(
      p => p.toString() === profile._id.toString()
    );

    if (!exists) {
      team.players.push(profile._id);
    }

    await team.save();

    invitation.status = "accepted";
    await invitation.save();

    await UserProfile.updateOne(
      { userId: invitation.userId },
      { isLookingForTeam: false }
    );

    // 🔥 IMPORTANT: RETURN POPULATED TEAM
    const updatedTeam = await Team.findById(team._id)
      .populate("captainId", "username")
      .populate("players", "fullName position avatar location phone");

    return res.json({
      success: true,
      data: updatedTeam,
      message: "Invitation accepted",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// REJECT INVITATION
// =========================
export const rejectInvitation = async (req, res) => {
  try {
    await Invitation.findByIdAndUpdate(req.params.id, {
      status: "rejected",
    });

    return res.json({
      success: true,
      message: "Đã từ chối lời mời.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};