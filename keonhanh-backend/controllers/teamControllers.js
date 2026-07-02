import Team from "../models/Team.js";
import UserProfile from "../models/UserProfile.js";
import mongoose from "mongoose";

// POST /api/teams — Tạo đội mới
const createTeam = async (req, res) => {
    try {
        const { name, logo, captainId, players = [], location, skillLevel } = req.body;

        // Validate required
        if (!name || !captainId || !location) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin (name, captainId, location)."
            });
        }

        // Validate captainId ObjectId
        if (!mongoose.Types.ObjectId.isValid(captainId)) {
            return res.status(400).json({
                success: false,
                message: "captainId không hợp lệ."
            });
        }

        // Validate từng playerId trong danh sách
        const invalidIds = players.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Các ID cầu thủ không hợp lệ: ${invalidIds.join(", ")}`
            });
        }

        // Kiểm tra các UserProfile tồn tại
        const allPlayerIds = [...new Set(players)]; // loại trùng
        if (allPlayerIds.length > 0) {
            const existingProfiles = await UserProfile.find({
                _id: { $in: allPlayerIds }
            }).select("_id fullName");

            if (existingProfiles.length !== allPlayerIds.length) {
                const foundIds = existingProfiles.map(p => p._id.toString());
                const notFound = allPlayerIds.filter(id => !foundIds.includes(id));
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy UserProfile: ${notFound.join(", ")}`
                });
            }

            // ✅ Kiểm tra xem cầu thủ nào đã có team chưa
            const teamsWithPlayers = await Team.find({
                players: { $in: allPlayerIds }
            }).select("name players");

            if (teamsWithPlayers.length > 0) {
                // Thu thập các player đã có team
                const takenPlayerIds = [];
                teamsWithPlayers.forEach(team => {
                    team.players.forEach(pid => {
                        if (allPlayerIds.includes(pid.toString())) {
                            takenPlayerIds.push(pid.toString());
                        }
                    });
                });

                // Lấy tên cầu thủ để thông báo rõ hơn
                const takenProfiles = existingProfiles.filter(p =>
                    takenPlayerIds.includes(p._id.toString())
                );
                const takenNames = takenProfiles.map(p => p.fullName).join(", ");

                return res.status(400).json({
                    success: false,
                    message: `Các cầu thủ sau đã thuộc đội khác: ${takenNames}`
                });
            }
        }

        const newTeam = await Team.create({
            name: name.trim(),
            logo: logo || "",
            captainId,
            players: allPlayerIds,
            location: location.trim(),
            skillLevel: skillLevel || "Beginner"
        });

        return res.status(201).json({
            success: true,
            message: "Tạo đội bóng thành công.",
            data: newTeam
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// GET /api/teams — Lấy danh sách tất cả đội
const getTeams = async (req, res) => {
    try {
        const teams = await Team.find()
            .populate("captainId", "username")
            .populate("players", "fullName position avatar location");

        return res.status(200).json({
            success: true,
            count: teams.length,
            data: teams
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// GET /api/teams/:id — Lấy chi tiết 1 đội
const getTeamById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ." });
        }

        const team = await Team.findById(id)
            .populate("captainId", "username")
            .populate("players", "fullName position avatar location phone");

        if (!team) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đội bóng." });
        }

        return res.status(200).json({ success: true, data: team });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/teams/:id/add-player — Thêm cầu thủ vào đội
const addPlayerToTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { playerProfileId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(playerProfileId)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ." });
        }

        // Kiểm tra UserProfile tồn tại
        const profile = await UserProfile.findById(playerProfileId).select("fullName");
        if (!profile) {
            return res.status(404).json({ success: false, message: "Không tìm thấy cầu thủ." });
        }

        // ✅ Kiểm tra cầu thủ đã có team chưa
        const existingTeam = await Team.findOne({ players: playerProfileId }).select("name");
        if (existingTeam) {
            return res.status(400).json({
                success: false,
                message: `Cầu thủ "${profile.fullName}" đã thuộc đội "${existingTeam.name}".`
            });
        }

        const team = await Team.findById(id);
        if (!team) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đội bóng." });
        }

        // Kiểm tra đã có trong đội chưa
        if (team.players.map(p => p.toString()).includes(playerProfileId)) {
            return res.status(400).json({ success: false, message: "Cầu thủ đã có trong đội." });
        }

        team.players.push(playerProfileId);
        await team.save();

        return res.status(200).json({
            success: true,
            message: `Đã thêm "${profile.fullName}" vào đội.`,
            data: team
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/teams/:id — Xóa đội
const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ." });
        }

        const team = await Team.findByIdAndDelete(id);
        if (!team) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đội bóng." });
        }

        return res.status(200).json({ success: true, message: "Xóa đội bóng thành công." });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export { createTeam, getTeams, getTeamById, addPlayerToTeam, deleteTeam };
