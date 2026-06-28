import Match from "../models/Match.js";
import Team from "../models/Team.js";
import mongoose from "mongoose";

const createMatch = async (req, res) => {
    try {
        const { teamName, location, fieldName, playTime } = req.body;

        // Validate required
        if (!teamName || !location || !fieldName || !playTime) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin (teamName, location, fieldName, playTime)."
            });
        }

        // Tìm đội bóng theo tên
        const team = await Team.findOne({ name: teamName.trim() });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đội bóng."
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

        const newMatch = await Match.create({
            creatorTeamId: team._id,
            location: location.trim(),
            fieldName: fieldName.trim(),
            playTime: date
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
        const { matchedWithTeamId } = req.body;

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

export { createMatch, getMatches, getMatchById, matchTeam, deleteMatch };