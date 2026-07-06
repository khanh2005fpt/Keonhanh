import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
    {
        // Profile của người xin vào đội
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserProfile",
            required: true
        },

        // Đội muốn xin vào
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teams",
            required: true
        },

        // Trạng thái yêu cầu
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("JoinRequest", joinRequestSchema, "JoinRequests");
