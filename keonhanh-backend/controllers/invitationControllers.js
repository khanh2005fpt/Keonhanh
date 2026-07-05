import Invitation from "../models/Invitation.js";
import UserProfile from "../models/UserProfile.js";
import Team from "../models/Team.js";

// =========================
// CREATE INVITATION
// =========================
export const createInvitation = async (req, res) => {
  try {
    const { teamId, captainId, playerProfileId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đội.",
      });
    }

    // Check if player is already in team
    if (team.players.includes(playerProfileId)) {
      return res.status(400).json({
        success: false,
        message: "Cầu thủ đã ở trong đội của bạn.",
      });
    }

    team.players.push(playerProfileId);
    await team.save();

    // Update player to no longer looking for team
    await UserProfile.findByIdAndUpdate(playerProfileId, {
      isLookingForTeam: false,
    });

    return res.json({
      success: true,
      message: "Đã thêm vào đội thành công",
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

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const invitations = await Invitation.find({
      playerProfileId: profile._id,
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
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    const team = await Team.findById(invitation.teamId);

    team.players.push(invitation.playerProfileId);
    await team.save();

    invitation.status = "accepted";
    await invitation.save();

    return res.json({
      success: true,
      message: "accepted",
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
      message: "rejected",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};