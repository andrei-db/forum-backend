import "dotenv/config";
import express from "express";
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
import homeRoutes from "./routes/home.js"
import groupRoutes from "./routes/groups.js"
import adminDashboardRoutes from "./routes/adminDashboard.js";
import settingsRoutes from "./routes/settings.js";
import cookieParser from "cookie-parser";
import { cleanupOldSessions } from "./utils/cleanupSessions.js";
import { sessionTracker } from "./middleware/sessionTracker.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(cookieParser());
app.use(sessionTracker);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/categories", categoryRoutes);
app.use("/forums", forumRoutes);
app.use("/topics", topicRoutes);
app.use("/posts", postRoutes);
app.use("/members", memberRoutes);
app.use("/online", onlineRoutes);
app.use("/home", homeRoutes);
app.use("/groups", groupRoutes )
app.use("/dashboard-data", adminDashboardRoutes);
app.use("/settings", settingsRoutes);
const PORT = process.env.PORT || 5000;

cleanupOldSessions();
setInterval(cleanupOldSessions, 1000 * 60 * 60);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});