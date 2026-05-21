import mongoose from "mongoose";
import User from "./User.js";

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true, 
    unique: true, // chặn 1 user nhiều profile

  },
  phoneNumber: {
    type: String,
    required: true,
  },
  
  avatar: {
    type: String,
    default: "",
  },

  fullName: {
    type: String,
    required: true,
  },

  position: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  isLookingForTeam: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("UserProfiles", userProfileSchema);