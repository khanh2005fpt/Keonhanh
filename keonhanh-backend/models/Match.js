import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema({
  creatorTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teams",
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  fieldName: {
    type: String,
    required: true,
  },

  playTime: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["open", "matched"],
    default: "open",
  },

  matchedWithTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teams",
    default: null,
  }
});

export default mongoose.model("Matches", MatchSchema, "Matches");