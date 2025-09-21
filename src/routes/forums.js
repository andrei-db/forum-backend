import { Router } from "express";
import Forum from "../models/Forum.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/category/:categoryId", async (req, res) => {
  try {
    const forums = await Forum.find({ category: req.params.categoryId }).sort({ order: 1 });
    res.json(forums);
  } catch (err) {
    console.error("Error fetching forums:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.post("/", authRequired, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const forum = await Forum.create(req.body);
    res.status(201).json(forum);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
