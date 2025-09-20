
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv'
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import categoryRoutes from "./routes/categories.js";
import cors from 'cors'
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true, 
}));
app.get("/test", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/categories", categoryRoutes);
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => {
      console.log(`Server running at http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => console.error("DB connection error:", err.message));
