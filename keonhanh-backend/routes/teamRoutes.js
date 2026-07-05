import express from "express";
import {
    createTeam,
    getTeams,
    getTeamById,
    getMyTeam,
    deleteTeam,
} from "../controllers/teamControllers.js";

const router = express.Router();

router.post("/", createTeam);
router.get("/", getTeams);
router.get("/my-team/:userId", getMyTeam);
router.get("/:id", getTeamById);
router.delete("/:id", deleteTeam);

export default router;