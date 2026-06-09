const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: String,
  location: String,
});

module.exports = mongoose.model('Team', TeamSchema);