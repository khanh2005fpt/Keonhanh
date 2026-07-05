import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teams",
      required: true,
    },

    captainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    playerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Invitation", invitationSchema, "Invitations");