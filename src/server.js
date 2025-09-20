
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config();
const app = express();
app.use(express.json());

app.get("/test", (_req, res) => {
  res.json({ ok: true });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => {
      console.log(`Server running at http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => console.error("DB connection error:", err.message));
