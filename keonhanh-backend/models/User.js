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
  }
);

/**
 * =========================
 * HASH PASSWORD (REGISTER)
 * =========================
 */
userSchema.statics.hashPassword = function (password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return `${salt}:${hash}`;
};

/**
 * =========================
 * CHECK PASSWORD (LOGIN)
 * SAFE VERSION - NO CRASH
 * =========================
 */
userSchema.methods.isValidPassword = function (password) {
  try {
    if (!this.password || !this.password.includes(":")) {
      return false;
    }

    const [salt, storedHash] = this.password.split(":");

    const hash = crypto
      .scryptSync(password, salt, 64)
      .toString("hex");

    // SAFE compare (NO timingSafeEqual crash)
    return storedHash === hash;

  } catch (err) {
    console.error("PASSWORD CHECK ERROR:", err);
    return false;
  }
};

export default mongoose.model("User", userSchema, "Users");