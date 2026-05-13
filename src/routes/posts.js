import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/top", async (req, res) => {
  try {
    const stats = await prisma.post.groupBy({
      by: ["authorId"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: stats.map((s) => s.authorId),
        },
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        role: true,
      },
    });

    const usersMap = new Map(users.map((user) => [user.id, user]));

    const result = stats.map((s) => ({
      user: usersMap.get(s.authorId),
      posts: s._count.id,
    }));

    res.json(result);
  } catch (err) {
    console.error("Error building leaderboard:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/recent", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      take: 4,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            profilePicture: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching recent posts:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/count", async (req, res) => {
  try {
    const count = await prisma.post.count();

    res.json({ count });
  } catch (err) {
    console.error("Error counting posts:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", authRequired, async (req, res) => {
  try {
    const { topic, topicId, content } = req.body;

    const finalTopicId = topicId || topic;

    if (!finalTopicId || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const post = await prisma.post.create({
      data: {
        topicId: finalTopicId,
        content,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            profilePicture: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", authRequired, async (req, res) => {
  try {
    const existingPost = await prisma.post.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.authorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const post = await prisma.post.update({
      where: {
        id: req.params.id,
      },
      data: {
        content: req.body.content || existingPost.content,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            profilePicture: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json(post);
  } catch (err) {
    console.error("Error editing post:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authRequired, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.authorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.post.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;