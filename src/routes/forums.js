import { Router } from "express";
import Forum from "../models/Forum.js";
import Topic from "../models/Topic.js";
import { authRequired } from "../middleware/auth.js";
import Post from "../models/Post.js";
const router = Router();
router.get("/messages-count", async (req, res) => {
  try {
    const counts = await Post.aggregate([
      {
        $lookup: {
          from: "topics",
          localField: "topic",
          foreignField: "_id",
          as: "topic"
        }
      },
      { $unwind: "$topic" },

      {
        $group: {
          _id: "$topic.forum",    
          messagesCount: { $sum: 1 }  
        }
      }
    ]);

    res.json(counts);
  } catch (err) {
    console.error("Error counting messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.get("/latest-posts", async (req, res) => {
    try {
        const forums = await Forum.find().lean();

        const results = await Promise.all(
            forums.map(async (forum) => {
                const topic = await Topic.findOne({ forum: forum._id })
                    .sort({ createdAt: -1 })
                    .lean();

                if (!topic) {
                    return { forum, lastPost: null };
                }

                const post = await Post.findOne({ topic: topic._id })
                    .populate("author", "username role")
                    .sort({ createdAt: -1 })
                    .lean();

                return {
                    forum,
                    lastPost: post
                        ? {
                            _id: post._id,
                            content: post.content,
                            createdAt: post.createdAt,
                            topic: { _id: topic._id, title: topic.title },
                            author: post.author,
                        }
                        : null,
                };
            })
        );

        res.json(results);
    } catch (err) {
        console.error("Error fetching latest posts per forum:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id/topics", async (req, res) => {
    try {
        const topics = await Topic.find({ forum: req.params.id })
            .populate("author", "username role")
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
