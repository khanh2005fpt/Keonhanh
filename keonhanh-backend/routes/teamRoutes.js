import express from "express";
import {
    createTeam,
    getTeams,
    getTeamById,
    getMyTeam,
    addPlayerToTeam,
    deleteTeam,
    toggleRecruiting,
} from "../controllers/teamControllers.js";
import { kickPlayer } from "../controllers/joinRequestControllers.js";

const router = express.Router();

router.post("/", createTeam);
router.get("/", getTeams);
router.get("/my-team/:profileId", getMyTeam);
router.get("/:id", getTeamById);
router.patch("/:id/add-player", addPlayerToTeam);
router.patch("/:teamId/kick/:profileId", kickPlayer);
router.patch("/:teamId/toggle-recruiting", toggleRecruiting);
router.delete("/:id", deleteTeam);

export default router;

