import express from "express";
import {
  createMatch,
  getMatches,
  getMatchById,
  matchTeam,
  deleteMatch,
} from "../controllers/matchControllers.js";

const router = express.Router();

router.post("/", createMatch);
router.get("/", getMatches);
router.get("/:id", getMatchById);
router.patch("/:id/match", matchTeam);
router.delete("/:id", deleteMatch);

export default router;