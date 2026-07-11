import express from "express";
import {
    sendJoinRequest,
    getRequestsForCaptain,
    getRequestsForPlayer,
    approveJoinRequest,
    rejectJoinRequest,
} from "../controllers/joinRequestControllers.js";

const router = express.Router();

// Gửi yêu cầu xin vào đội
router.post("/", sendJoinRequest);

// Đội trưởng lấy danh sách yêu cầu pending của đội mình
router.get("/captain/:captainUserId", getRequestsForCaptain);

// Cầu thủ lấy danh sách yêu cầu pending của mình
router.get("/player/:profileId", getRequestsForPlayer);

// Phê duyệt yêu cầu
router.patch("/:id/approve", approveJoinRequest);

// Từ chối yêu cầu
router.patch("/:id/reject", rejectJoinRequest);

export default router;
