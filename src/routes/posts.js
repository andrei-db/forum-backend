import { Router } from "express";
import Post from "../models/Post.js";
import { authRequired } from "../middleware/auth.js";
import User from "../models/User.js";
const router = Router();
router.get("/top", async (req, res) => {
  try {
    const stats = await Post.aggregate([
      { $group: { _id: "$author", posts: { $sum: 1 } } },
      { $sort: { posts: -1 } },
      { $limit: 5 },
    ]);

    const users = await User.populate(stats, { path: "_id", select: "username profilePicture role" });

    res.json(users.map(u => ({
      user: u._id,
      posts: u.posts
    })));
  } catch (err) {
    console.error("Error building leaderboard:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.get("/recent", async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("author", "username role profilePicture")
            .populate("topic", "title")
            .sort({ createdAt: -1 })
            .limit(4);

        res.json(posts);
    } catch (err) {
        console.error("Error fetching recent posts:", err);
        res.status(500).json({ error: "Server error" });
    }
});
router.get("/count", async (req, res) => {
  try {
    const count = await Post.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error("Error counting posts:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/", authRequired, async (req, res) => {
  try {
    const { topic, content } = req.body;

    if (!topic || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const post = await Post.create({
      topic,
      content,
      author: req.user.id,
    });

    await post.populate("author", "username role profilePicture");

    res.status(201).json(post);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", authRequired, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    post.content = req.body.content || post.content;
    await post.save();

    await post.populate("author", "username role profilePicture");
    res.json(post);
  } catch (err) {
    console.error("Error editing post:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authRequired, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Server error" });
  }
});
export default router;
