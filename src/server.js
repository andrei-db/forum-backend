
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv'
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import categoryRoutes from "./routes/categories.js";
import forumRoutes from "./routes/forums.js";
import cors from 'cors'
import topicRoutes from "./routes/topics.js";
import postRoutes from "./routes/posts.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
    origin: [
    "http://localhost:5173", 
    "https://forum-frontend-three.vercel.app/"
  ],
    credentials: true,
}));
app.get("/test", (_req, res) => {
    res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/categories", categoryRoutes);
app.use("/forums", forumRoutes);
app.use("/topics", topicRoutes);
app.use("/posts", postRoutes);
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(process.env.PORT || 4000, () => {
            console.log(`Server running`);
        });
    })
    .catch(err => console.error("DB connection error:", err.message));
