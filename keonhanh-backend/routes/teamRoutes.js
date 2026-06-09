const express = require('express');
const router = express.Router();

const {
  getTeams,
  createTeam,
  deleteTeam,
  updateTeam,
} = require('../controllers/teamController');

router.get('/', getTeams);
router.post('/', createTeam);
router.delete('/:id', deleteTeam);
router.put('/:id', updateTeam);

module.exports = router;