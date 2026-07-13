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
import joinRequestRoutes from "./routes/joinRequestRoutes.js"
import invitationRoutes from "./routes/invitationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import http from "http";
import { Server } from "socket.io";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors());
dotenv.config();
app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/user-profiles", profileRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/messages", messageRoutes);

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
    
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      socket.on("joinTeam", (teamId) => {
        socket.join(teamId);
        console.log(`Socket ${socket.id} joined team ${teamId}`);
      });

      socket.on("sendMessage", async (data) => {
        try {
          const Message = (await import("./models/Message.js")).default;
          const newMessage = new Message({
            team: data.teamId,
            sender: data.senderId,
            content: data.content,
          });
          await newMessage.save();

          const populatedMessage = await Message.findById(newMessage._id).populate("sender", "username fullName avatar email");

          io.to(data.teamId).emit("receiveMessage", populatedMessage);
        } catch (err) {
          console.error("Error saving message:", err);
        }
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    const server = httpServer.listen(PORT, "0.0.0.0", () => {
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
