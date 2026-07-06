import Match from "../models/Match.js";
import Team from "../models/Team.js";
import mongoose from "mongoose";

const createMatch = async (req, res) => {
    try {
        const { userId, location, fieldName, playTime, latitude, longitude } = req.body;

        // Validate required
        if (!userId || !location || !fieldName || !playTime) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin (location, fieldName, playTime)."
            });
        }

        // Tìm đội bóng theo captainId
        const team = await Team.findOne({ captainId: userId });

        if (!team) {
            return res.status(403).json({
                success: false,
                message: "Chỉ đội trưởng mới có quyền tạo kèo. Bạn chưa tạo đội bóng nào."
            });
        }

        // Validate playTime
        const date = new Date(playTime);

        if (isNaN(date.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Thời gian thi đấu không hợp lệ."
            });
        }

        if (date <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Thời gian thi đấu phải lớn hơn thời điểm hiện tại."
            });
        }

        // Kiểm tra khoảng cách 3 tiếng với các trận đã có của đội
        const threeHoursInMs = 3 * 60 * 60 * 1000;
        const existingMatches = await Match.find({
            $or: [{ creatorTeamId: team._id }, { matchedWithTeamId: team._id }]
        });

        for (let m of existingMatches) {
            const timeDiff = Math.abs(date.getTime() - new Date(m.playTime).getTime());
            if (timeDiff < threeHoursInMs) {
                return res.status(400).json({
                    success: false,
                    message: "Đội của bạn đã có một trận đấu diễn ra quá sát giờ (cách nhau dưới 3 tiếng). Vui lòng chọn thời gian khác."
                });
            }
        }

        const newMatch = await Match.create({
            creatorTeamId: team._id,
            location: location.trim(),
            fieldName: fieldName.trim(),
            playTime: date,
            latitude,
            longitude
        });

        return res.status(201).json({
            success: true,
            message: "Đăng kèo thành công.",
            data: newMatch
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

const getMatches = async (req, res) => {

    try {

        const matches = await Match.find({
            status: "open"
        })
            .populate("creatorTeamId", "name logo")
            .populate("matchedWithTeamId", "name logo")
            .sort({
                playTime: 1
            });

        return res.status(200).json({
            success: true,
            count: matches.length,
            data: matches
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

const getMatchById = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Id không hợp lệ"
            });
        }

        const match = await Match.findById(id)
            .populate("creatorTeamId", "name logo")
            .populate("matchedWithTeamId", "name logo");

        if (!match) {
            return res.status(404).json({
                message: "Không tìm thấy trận đấu"
            });
        }

        res.status(200).json(match);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

const matchTeam = async (req, res) => {
    try {

        const { id } = req.params;
        const { matchedWithTeamId, userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(matchedWithTeamId)) {

            return res.status(400).json({
                message: "Id không hợp lệ"
            });

        }

        const match = await Match.findById(id);

        if (!match) {
            return res.status(404).json({
                message: "Không tìm thấy trận đấu"
            });
        }

        if (match.status !== "open") {
            return res.status(400).json({
                message: "Trận đấu đã được ghép hoặc đã hủy"
            });
        }

        if (match.creatorTeamId.toString() === matchedWithTeamId) {
            return res.status(400).json({
                message: "Không thể nhận kèo của chính đội mình"
            });
        }

        const team = await Team.findById(matchedWithTeamId);

        if (!team) {
            return res.status(404).json({
                message: "Không tìm thấy đội bóng"
            });
        }

        if (team.captainId.toString() !== userId) {
            return res.status(403).json({
                message: "Chỉ đội trưởng mới có quyền nhận kèo"
            });
        }

        // Kiểm tra khoảng cách 3 tiếng với các trận đã có của đội
        const threeHoursInMs = 3 * 60 * 60 * 1000;
        const newPlayTime = new Date(match.playTime);
        const existingMatches = await Match.find({
            $or: [{ creatorTeamId: matchedWithTeamId }, { matchedWithTeamId: matchedWithTeamId }]
        });

        for (let m of existingMatches) {
            const timeDiff = Math.abs(newPlayTime.getTime() - new Date(m.playTime).getTime());
            if (timeDiff < threeHoursInMs) {
                return res.status(400).json({
                    message: "Đội của bạn đã có một trận đấu diễn ra quá sát giờ (cách nhau dưới 3 tiếng). Vui lòng chọn kèo khác."
                });
            }
        }

        match.matchedWithTeamId = matchedWithTeamId;
        match.status = "matched";

        await match.save();

        res.status(200).json({
            message: "Nhận kèo thành công",
            match
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

const deleteMatch = async (req, res) => {

    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Id không hợp lệ"
            });
        }

        const match = await Match.findById(id);

        if (!match) {
            return res.status(404).json({
                message: "Không tìm thấy trận đấu"
            });
        }

        await Match.findByIdAndDelete(id);

        res.status(200).json({
            message: "Xóa trận đấu thành công"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const getMyMatches = async (req, res) => {
    try {
        const { teamId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: "Id không hợp lệ" });
        }
        
        const matches = await Match.find({
            $or: [{ creatorTeamId: teamId }, { matchedWithTeamId: teamId }]
        })
        .populate("creatorTeamId", "name logo")
        .populate("matchedWithTeamId", "name logo")
        .sort({ playTime: 1 });

        return res.status(200).json({ success: true, data: matches });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const cancelMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Id không hợp lệ" });
        }

        const match = await Match.findById(id).populate("creatorTeamId").populate("matchedWithTeamId");

        if (!match) {
            return res.status(404).json({ message: "Không tìm thấy trận đấu" });
        }

        if (match.status !== "matched") {
            return res.status(400).json({ message: "Trận đấu không ở trạng thái có thể hủy ghép" });
        }

        // Verify that the user is the captain of either team
        const isCreatorCaptain = match.creatorTeamId?.captainId?.toString() === userId;
        const isMatchedCaptain = match.matchedWithTeamId?.captainId?.toString() === userId;

        if (!isCreatorCaptain && !isMatchedCaptain) {
            return res.status(403).json({ message: "Chỉ đội trưởng của 2 đội mới có quyền hủy kèo" });
        }

        match.matchedWithTeamId = null;
        match.status = "open";

        await match.save();

        res.status(200).json({ message: "Hủy kèo thành công", match });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { createMatch, getMatches, getMatchById, matchTeam, deleteMatch, getMyMatches, cancelMatch };