import express from "express";
import { getTeamMessages } from "../controllers/messageControllers.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:teamId", authMiddleware, getTeamMessages);

export default router;
