import { Router } from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
const router = Router();

router.get("/:username", async (req, res) => {
  try {
    const member = await User.findOne({ username: req.params.username })
      .select("_id username email profilePicture role createdAt lastSeen");

    if (!member) {
      return res.status(404).json({ error: "User not found" });
    }

    const postsCount = await Post.countDocuments({ author: member._id });

    res.json({
      ...member.toObject(),
      postsCount,
    });
  } catch (err) {
    console.error("Error fetching user by username:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
