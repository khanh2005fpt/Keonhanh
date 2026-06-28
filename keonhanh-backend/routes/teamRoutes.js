import express from "express";
import {
    createTeam,
    getTeams,
    getTeamById,
    getMyTeam,
    addPlayerToTeam,
    deleteTeam,
} from "../controllers/teamControllers.js";

const router = express.Router();

router.post("/", createTeam);
router.get("/", getTeams);
router.get("/my-team/:profileId", getMyTeam);
router.get("/:id", getTeamById);
router.patch("/:id/add-player", addPlayerToTeam);
router.delete("/:id", deleteTeam);

export default router;
