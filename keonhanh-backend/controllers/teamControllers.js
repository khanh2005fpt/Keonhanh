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

        // Chặn ảnh quá to (trên ~1.5MB base64) để tránh đơ Database và treo server
        if (logo && logo.length > 2000000) {
            return res.status(400).json({
                success: false,
                message: "Kích thước ảnh quá lớn, không thể lưu. Vui lòng chọn ảnh nhỏ hơn."
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

        // Tự động tìm Profile của Đội trưởng để đưa luôn vào danh sách players
        const captainProfile = await UserProfile.findOne({ userId: captainId });
        if (!captainProfile) {
            return res.status(400).json({
                success: false,
                message: "Không tìm thấy hồ sơ cá nhân của Đội trưởng."
            });
        }

        // Gộp danh sách players gửi lên (nếu có) VÀ ID profile của Đội trưởng
        const allPlayerIds = [...new Set([...players, captainProfile._id.toString()])];

        // Kiểm tra các UserProfile tồn tại
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

            // ✅ Kiểm tra xem đội trưởng đã tạo/làm leader đội nào chưa
            const existingLedTeam = await Team.findOne({ captainId });
            if (existingLedTeam) {
                return res.status(400).json({
                    success: false,
                    message: "Bạn chỉ được phép tạo hoặc làm đội trưởng duy nhất 1 đội."
                });
            }
        }

        const newTeam = await Team.create({
            name: name.trim(),
            logo: logo || "",
            captainId,
            players: allPlayerIds,
            location: location.trim(),
            skillLevel: skillLevel || "Sơ cấp"
        });

        // Tối ưu: Không gửi trả lại chuỗi base64 logo khổng lồ về điện thoại để tránh đơ app
        const teamData = newTeam.toObject();
        delete teamData.logo;

        return res.status(201).json({
            success: true,
            message: "Tạo đội bóng thành công.",
            data: teamData
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
            .populate("players", "fullName position avatar location userId");

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
            .populate("players", "fullName position avatar location phone userId");

        if (!team) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đội bóng." });
        }

        return res.status(200).json({ success: true, data: team });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/teams/my-team/:profileId — Lấy đội bóng của tôi theo profileId
const getMyTeam = async (req, res) => {
    try {
        const { profileId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json({ success: false, message: "profileId không hợp lệ." });
        }

        // Bước 1: Lấy thông tin Profile để có được userId (dùng làm fallback cho các team cũ)
        const profile = await UserProfile.findById(profileId);

        //    console.log(`[getMyTeam] profileId nhận được từ App: ${profileId}`);
        //     console.log(`[getMyTeam] userId tương ứng của profile: ${profile?.userId}`);

        // Kiểm tra xem profileId của thằng đang đăng nhập CÓ CHỨA TRONG mảng players hay không
        const teams = await Team.find({
            players: profileId
        })
            .populate("captainId", "username")
            .populate("players", "fullName position avatar location phone userId");

        if (!teams || teams.length === 0) {
            return res.status(404).json({ success: false, message: "Bạn chưa gia nhập hoặc tạo đội bóng nào." });
        }

        return res.status(200).json({ success: true, data: teams });
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
            message: `Đã mời "${profile.fullName}" vào đội.`,
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

// PATCH /api/teams/:teamId/toggle-recruiting — Đội trưởng bật/tắt tuyển quân
const TEAM_MAX_SIZE = 14;
const TEAM_MIN_TO_CLOSE = 7;

const toggleRecruiting = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { captainUserId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ success: false, message: "ID đội không hợp lệ." });
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đội bóng." });
        }

        // Kiểm tra quyền đội trưởng
        if (team.captainId.toString() !== captainUserId) {
            return res.status(403).json({ success: false, message: "Chỉ đội trưởng mới có thể thao tác này." });
        }

        const currentCount = team.players.length;

        // Nếu đội đã đủ 14 người → khóa cứng, không cho thay đổi
        if (currentCount >= TEAM_MAX_SIZE) {
            team.isRecruiting = false;
            team.recruitingStatus = "Full";
            await team.save();
            return res.status(400).json({
                success: false,
                message: `Đội đã đủ ${TEAM_MAX_SIZE} người, không thể mở tuyển thêm.`
            });
        }

        // Muốn dừng tuyển thủ công: cần ít nhất 7 người
        if (team.isRecruiting && currentCount < TEAM_MIN_TO_CLOSE) {
            return res.status(400).json({
                success: false,
                message: `Cần có ít nhất ${TEAM_MIN_TO_CLOSE} người trước khi dừng tuyển (hiện tại: ${currentCount}).`
            });
        }

        // Toggle
        team.isRecruiting = !team.isRecruiting;
        team.recruitingStatus = team.isRecruiting ? "Searching" : "Full";
        await team.save();

        return res.status(200).json({
            success: true,
            isRecruiting: team.isRecruiting,
            message: team.isRecruiting
                ? "Đã mở lại tuyển thành viên."
                : "Đã dừng tuyển thành viên. Người khác sẽ không thể gửi yêu cầu gia nhập."
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export { createTeam, getTeams, getTeamById, getMyTeam, addPlayerToTeam, deleteTeam, toggleRecruiting };