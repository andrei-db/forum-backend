import { Router } from "express";
import Post from "../models/Post.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

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
