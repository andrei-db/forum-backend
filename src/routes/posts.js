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

    await post.populate("author", "username");

    res.status(201).json(post);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
