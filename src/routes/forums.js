import { Router } from "express";
import Forum from "../models/Forum.js";
import Topic from "../models/Topic.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/:id/topics", async (req, res) => {
  try {
    const topics = await Topic.find({ forum: req.params.id })
      .populate("author", "username")
      .sort({ createdAt: -1 });
    res.json(topics);
  } catch (err) {
    console.error("Error fetching topics:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.status(404).json({ error: "Forum not found" });
    res.json(forum);
  } catch (err) {
    console.error("Error fetching forum:", err);
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
