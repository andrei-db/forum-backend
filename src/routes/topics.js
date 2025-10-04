import { Router } from "express";
import Topic from "../models/Topic.js";
import Post from "../models/Post.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
router.patch("/:id/sticky", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    topic.sticky = !topic.sticky;
    await topic.save();

    res.json({ message: `Topic is now ${topic.sticky ? "sticky" : "normal"}`, topic });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
router.patch("/:id/closed", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    topic.closed = !topic.closed;
    await topic.save();

    res.json({ message: `Topic is now ${topic.closed ? "closed" : "open"}`, topic });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/count", async (req, res) => {
  try {
    const count = await Topic.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error("Error counting topics:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/recent", async (req, res) => {
    try {
        const topics = await Topic.find()
            .populate("author", "username role profilePicture")
            .sort({ createdAt: -1 })
            .limit(4);

        res.json(topics);
    } catch (err) {
        console.error("Error fetching recent topics:", err);
        res.status(500).json({ error: "Server error" });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id)
            .populate("author", "username role profilePicture")
            .lean();

        if (!topic) {
            return res.status(404).json({ error: "Topic not found" });
        }

        const posts = await Post.find({ topic: topic._id })
            .populate("author", "username role profilePicture createdAt")
            .sort({ createdAt: 1 });

        res.json({ ...topic, posts });
    } catch (err) {
        console.error("Error fetching topic:", err);
        res.status(500).json({ error: "Server error" });
    }
});


router.post("/", authRequired, async (req, res) => {
    try {
        const { forum, title, content } = req.body;

        const topic = await Topic.create({
            forum,
            title,
            author: req.user.id,
        });

        await Post.create({
            topic: topic._id,
            content,
            author: req.user.id,
        });

        res.status(201).json(topic);
    } catch (err) {
        console.error("Error creating topic:", err);
        res.status(400).json({ error: err.message });
    }
});

export default router;
