import express from "express";
import {
  createInvitation,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
} from "../controllers/invitationControllers.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createInvitation);
router.get("/me", authMiddleware, getMyInvitations);
router.patch("/:id/accept", authMiddleware, acceptInvitation);
router.patch("/:id/reject", authMiddleware, rejectInvitation);

export default router;