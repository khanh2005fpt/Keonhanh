import JoinRequest from "../models/JoinRequest.js";
import Team from "../models/Team.js";
import UserProfile from "../models/UserProfile.js";
import mongoose from "mongoose";

// POST /api/join-requests
// Người dùng xin vào đội (cần đã đăng nhập và có UserProfile)
const sendJoinRequest = async (req, res) => {
    try {
        const { requesterId, teamId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(requesterId) || !mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ." });
        }

        // Kiểm tra profile tồn tại
        const profile = await UserProfile.findById(requesterId);
        if (!profile) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ cá nhân." });
        }

        // Kiểm tra người này đã có đội chưa (đã bỏ để hỗ trợ tham gia nhiều đội)
        // const existingTeam = await Team.findOne({ players: requesterId });
        // if (existingTeam) {
        //     return res.status(400).json({
        //         success: false,
        //         message: `Bạn đã là thành viên của đội "${existingTeam.name}". Hãy rời đội trước.`
        //     });
        // }

        // Kiểm tra đội tồn tại
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đội bóng." });
        }

        // Kiểm tra xem cầu thủ đã nằm trong đội này chưa
        if (team.players.map(p => p.toString()).includes(requesterId.toString())) {
            return res.status(400).json({
                success: false,
                message: "Bạn đã là thành viên của đội bóng này rồi."
            });
        }

        // Kiểm tra đội có đang tuyển quân không
        if (!team.isRecruiting) {
            return res.status(400).json({
                success: false,
                message: "Đội đã đủ người, không nhận thêm thành viên."
            });
        }

        // Kiểm tra giới hạn tối đa 14 người
        if (team.players.length >= 14) {
            // Tự động khóa nếu chưa khóa
            if (team.isRecruiting) {
                team.isRecruiting = false;
                team.recruitingStatus = "Full";
                await team.save();
            }
            return res.status(400).json({
                success: false,
                message: "Đội đã đủ người, không nhận thêm thành viên."
            });
        }

        // Kiểm tra đã gửi yêu cầu pending chưa
        const existingRequest = await JoinRequest.findOne({
            requesterId,
            teamId,
            status: "pending"
        });
        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "Bạn đã gửi yêu cầu tới đội này rồi, hãy chờ đội trưởng phê duyệt."
            });
        }

        const newRequest = await JoinRequest.create({ requesterId, teamId });

        return res.status(201).json({
            success: true,
            message: `Đã gửi yêu cầu xin vào đội "${team.name}". Đang chờ đội trưởng phê duyệt.`,
            data: newRequest
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};


// GET /api/join-requests/captain/:captainUserId
// Đội trưởng lấy danh sách yêu cầu pending của đội mình
const getRequestsForCaptain = async (req, res) => {
    try {
        const { captainUserId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(captainUserId)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ." });
        }

        // Tìm đội mà user này là đội trưởng
        const team = await Team.findOne({ captainId: captainUserId });
        if (!team) {
            return res.status(404).json({
                success: false,
                message: "Bạn không phải đội trưởng của đội nào."
            });
        }

        // Lấy các yêu cầu pending của đội đó
        const requests = await JoinRequest.find({
            teamId: team._id,
            status: "pending"
        }).populate("requesterId", "fullName position location avatar phone");

        return res.status(200).json({
            success: true,
            count: requests.length,
            teamId: team._id,
            data: requests
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/join-requests/player/:profileId
// Người chơi lấy danh sách yêu cầu đang chờ duyệt của mình
const getRequestsForPlayer = async (req, res) => {
    try {
        const { profileId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ." });
        }

        const requests = await JoinRequest.find({
            requesterId: profileId,
            status: "pending"
        }).populate("teamId", "name location logo captainId");

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/join-requests/:id/approve
// Đội trưởng phê duyệt → thêm vào đội, isLookingForTeam = false
const approveJoinRequest = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ." });
        }

        const request = await JoinRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu." });
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Yêu cầu này đã được xử lý rồi."
            });
        }

        const team = await Team.findById(request.teamId);
        if (!team) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đội bóng." });
        }

        // Kiểm tra cầu thủ đã có team chưa (đã bỏ để hỗ trợ tham gia nhiều đội)
        // const alreadyInTeam = await Team.findOne({ players: request.requesterId });
        // if (alreadyInTeam) {
        //     request.status = "rejected";
        //     await request.save();
        //     return res.status(400).json({
        //         success: false,
        //         message: "Cầu thủ này đã gia nhập một đội khác."
        //     });
        // }

        // Thêm vào đội
        if (!team.players.map(p => p.toString()).includes(request.requesterId.toString())) {
            team.players.push(request.requesterId);
            // Tự động khóa tuyển quân nếu đội đủ 14 người
            if (team.players.length >= 14) {
                team.isRecruiting = false;
                team.recruitingStatus = "Full";
            }
            await team.save();
        }

        // Cập nhật isLookingForTeam = false
        await UserProfile.findByIdAndUpdate(request.requesterId, { isLookingForTeam: false });

        // Cập nhật trạng thái request
        request.status = "approved";
        await request.save();

        // Tự động từ chối tất cả pending request khác của người này (đã bỏ để hỗ trợ tham gia nhiều đội)
        // await JoinRequest.updateMany(
        //     { requesterId: request.requesterId, status: "pending", _id: { $ne: id } },
        //     { status: "rejected" }
        // );

        return res.status(200).json({
            success: true,
            message: "Đã phê duyệt thành viên vào đội."
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/join-requests/:id/reject
// Đội trưởng từ chối — isLookingForTeam vẫn true
const rejectJoinRequest = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ." });
        }

        const request = await JoinRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu." });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ success: false, message: "Yêu cầu này đã được xử lý rồi." });
        }

        request.status = "rejected";
        await request.save();

        return res.status(200).json({
            success: true,
            message: "Đã từ chối yêu cầu gia nhập."
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/teams/:teamId/kick/:profileId
// Đội trưởng kick thành viên → xóa khỏi đội, isLookingForTeam = true
const kickPlayer = async (req, res) => {
    try {
        const { teamId, profileId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ." });
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đội bóng." });
        }

        // Không cho kick đội trưởng
        const captainProfile = await UserProfile.findOne({ userId: team.captainId });
        if (captainProfile && captainProfile._id.toString() === profileId) {
            return res.status(400).json({
                success: false,
                message: "Không thể kick đội trưởng."
            });
        }

        // Kiểm tra thành viên có trong đội không
        const playerIndex = team.players.map(p => p.toString()).indexOf(profileId);
        if (playerIndex === -1) {
            return res.status(404).json({ success: false, message: "Cầu thủ không có trong đội." });
        }

        // Xóa khỏi đội
        team.players.splice(playerIndex, 1);
        await team.save();

        // Cập nhật isLookingForTeam = true
        await UserProfile.findByIdAndUpdate(profileId, { isLookingForTeam: true });

        return res.status(200).json({
            success: true,
            message: "Đã kick thành viên khỏi đội."
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export {
    sendJoinRequest,
    getRequestsForCaptain,
    getRequestsForPlayer,
    approveJoinRequest,
    rejectJoinRequest,
    kickPlayer
};
