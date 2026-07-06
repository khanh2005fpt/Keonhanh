import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(

    {

        name: {
            type: String,
            required: true,
            trim: true
        },


        logo: {
            type: String,
            default: ""
        },


        captainId: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true

        },


        players: {

            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "UserProfile"
                }
            ],

            default: []

        },


        location: {

            type: String,

            required: true,

            trim: true

        },


        skillLevel: {

            type: String,

            enum: [
                "Sơ cấp",
                "Trung cấp",
                "Chuyên nghiệp"
            ],

            default: "Sơ cấp"

        },


        isRecruiting: {

            type: Boolean,

            default: true

        },


        recruitingStatus: {

            type: String,

            enum: [
                "Searching",
                "Full"
            ],

            default: "Searching"

        }

    },

    {
        timestamps: true
    }

);

export default mongoose.model("Teams", teamSchema, "Teams")