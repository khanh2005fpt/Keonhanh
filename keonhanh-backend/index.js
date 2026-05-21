import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import cors from "cors"

import playerRoutes from "./routes/playerRoutes.js";
import User from "./models/User.js";
import UserProfile from "./models/UserProfile.js";

const app = express();
app.use(bodyParser.json());
app.use(cors());
dotenv.config();
app.use("/api/players", playerRoutes);

const PORT = process.env.PORT || 9999;
const MONGOURL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || "keonhanh";

if (!MONGOURL) {
  console.error("Missing MONGO_URL in .env");
  process.exit(1);
}

app.get("/", (req, res) => {
  res.json({ message: "Keo nhanh API is running" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const password = req.body.password;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Vui long nhap username va mat khau" });
    }

    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username phai co it nhat 3 ky tu" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mat khau phai co it nhat 6 ky tu" });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({ message: "Username da ton tai" });
    }

    const user = await User.create({
      username,
      passwordHash: User.hashPassword(password),
    });

    return res.status(201).json({
      message: "Dang ky tai khoan thanh cong",
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Register failed:", error);

    if (error.code === 11000) {
      return res.status(409).json({ message: "Username da ton tai" });
    }

    return res.status(500).json({ message: "Khong the dang ky tai khoan" });
  }
});

app.post("/api/user-profiles", async (req, res) => {
  try {
    const {
      userId,
      phoneNumber,
      avatar = "",
      fullName,
      position,
      location,
    } = req.body;

    if (!userId || !phoneNumber || !fullName || !position || !location) {
      return res
        .status(400)
        .json({ message: "Vui long nhap day du thong tin profile" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "UserId khong hop le" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Khong tim thay user" });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        phoneNumber: phoneNumber.trim(),
        avatar: avatar.trim(),
        fullName: fullName.trim(),
        position: position.trim(),
        location: location.trim(),
        isLookingForTeam: true,
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      },
    );

    return res.status(201).json({
      message: "Cap nhat profile thanh cong",
      profile,
    });
  } catch (error) {
    return res.status(500).json({ message: "Khong the cap nhat profile" });
  }
});

mongoose
  .connect(MONGOURL, { dbName: DB_NAME, serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log("DB connected successfully");
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port: ${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Stop the old server or choose another PORT.`,
        );
        process.exit(1);
      }

      console.error("Server failed:", error.message);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  });
