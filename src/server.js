import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import categoryRoutes from "./routes/categories.js";
import forumRoutes from "./routes/forums.js";
import topicRoutes from "./routes/topics.js";
import postRoutes from "./routes/posts.js";
import memberRoutes from './routes/members.js'
import onlineRoutes from './routes/online.js'
import cookieParser from "cookie-parser";
import { sessionTracker } from "./middleware/sessionTracker.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: ["http://localhost:5173", "https://forum-frontend-three.vercel.app"],
  credentials: true,
}));
app.use(cookieParser());
app.use(sessionTracker);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/categories", categoryRoutes);
app.use("/forums", forumRoutes);
app.use("/topics", topicRoutes);
app.use("/posts", postRoutes);
app.use("/members", memberRoutes);
app.use("/online", onlineRoutes);
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 4000, () => {
      console.log(`Server running`);
    });
  })
  .catch(err => console.error("DB connection error:", err.message));
