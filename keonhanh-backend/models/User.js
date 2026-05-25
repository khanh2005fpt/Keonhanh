import crypto from "crypto";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "player",
    },
  },
  {
    timestamps: true,
  },
);

userSchema.statics.hashPassword = function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
};

userSchema.methods.isValidPassword = function isValidPassword(password) {
  const [salt, storedHash] = this.password.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(hash, "hex"));
};

export default mongoose.model("User", userSchema, "Users");
