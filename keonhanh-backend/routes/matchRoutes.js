import express from "express";
import {
  createMatch,
  getMatches,
  getMatchById,
  matchTeam,
  deleteMatch,
  getMyMatches,
  cancelMatch,
} from "../controllers/matchControllers.js";

const router = express.Router();

router.post("/", createMatch);
router.get("/", getMatches);
router.get("/:id", getMatchById);
router.get("/my-matches/:teamId", getMyMatches);
router.patch("/:id/match", matchTeam);
router.patch("/:id/cancel", cancelMatch);
router.delete("/:id", deleteMatch);

export default router;