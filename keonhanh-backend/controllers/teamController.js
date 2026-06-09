const Team = require('../models/Team');
const mongoose = require('mongoose');

exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const team = await Team.create(req.body);
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    console.log('REQ PARAMS:', req.params);

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Missing ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Team.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Missing ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const team = await Team.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};