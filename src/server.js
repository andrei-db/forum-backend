import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import categoryRoutes from "./routes/categories.js";
import forumRoutes from "./routes/forums.js";
import topicRoutes from "./routes/topics.js";
import postRoutes from "./routes/posts.js";
import User from "./models/User.js";

dotenv.config();
const app = express();
const httpServer = createServer(app); 
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://forum-frontend-three.vercel.app"],
    credentials: true,
  },
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: ["http://localhost:5173", "https://forum-frontend-three.vercel.app"],
  credentials: true,
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/categories", categoryRoutes);
app.use("/forums", forumRoutes);
app.use("/topics", topicRoutes);
app.use("/posts", postRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    httpServer.listen(process.env.PORT || 4000, () => {
      console.log(`Server running`);
    });
  })
  .catch(err => console.error("DB connection error:", err.message));

  io.on("connection", (socket) => {
  console.log("🔵 User connected:", socket.id);

  socket.on("user_online", async (user) => {
    socket.userId = user.id; 
    await User.findByIdAndUpdate(user.id, { online: true, lastSeen: new Date() });

    const onlineUsers = await User.find({ online: true })
      .select("_id username profilePicture role");
    io.emit("online_users", onlineUsers);
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { online: false, lastSeen: new Date() });

      const onlineUsers = await User.find({ online: true })
        .select("_id username profilePicture role");
      io.emit("online_users", onlineUsers);
    }
  });
});
