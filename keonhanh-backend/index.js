import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import cors from "cors"

import authRoutes from "./routes/authRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import matchRoutes from "./routes/matchRoutes.js"
import teamRoutes from "./routes/teamRoutes.js"

const app = express();
app.use(bodyParser.json());
app.use(cors());
dotenv.config();
app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/user-profiles", profileRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/teams", teamRoutes);

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
