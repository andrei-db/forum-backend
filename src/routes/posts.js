import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/authRequired.js";
import { canReplyForum } from "../utils/forumPermissions.js";
const router = Router();
const groupSelect = {
  id: true,
  name: true,
  slug: true,
  color: true,
  isStaff: true,
};

async function getCurrentUser(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      group: true,
    },
  });
}
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
        group: {
          select: groupSelect,
        },
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
            group: {
              select: groupSelect,
            },
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
    const cleanContent = content?.trim();

    if (!finalTopicId || !cleanContent) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existingTopic = await prisma.topic.findUnique({
      where: { id: finalTopicId },
    });

    if (!existingTopic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    if (existingTopic.closed) {
      return res.status(400).json({ error: "Topic is closed" });
    }

    const allowed = await canReplyForum(req, existingTopic.forumId);

    if (!allowed) {
      return res.status(403).json({
        error: "You do not have permission to reply",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          topicId: finalTopicId,
          content: cleanContent,
          authorId: req.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              group: {
                select: groupSelect,
              },
              profilePicture: true,
              createdAt: true,
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

      await tx.topic.update({
        where: { id: finalTopicId },
        data: {
          postsCount: {
            increment: 1,
          },
          lastPostId: post.id,
        },
      });

      return post;
    });

    res.status(201).json(result);
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

    const currentUser = await getCurrentUser(req.user.id);

    if (existingPost.authorId !== req.user.id && !currentUser?.group?.isStaff) {
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
            group: {
              select: groupSelect,
            },
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
      where: { id: req.params.id },
      include: {
        topic: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.topic.firstPostId === post.id) {
      return res.status(400).json({
        error: "First post cannot be deleted. Delete the topic instead.",
      });
    }

    const currentUser = await getCurrentUser(req.user.id);

    if (req.user.id !== post.authorId && !currentUser?.group?.isStaff) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.delete({
        where: { id: req.params.id },
      });

      const lastPost = await tx.post.findFirst({
        where: {
          topicId: post.topicId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      await tx.topic.update({
        where: {
          id: post.topicId,
        },
        data: {
          postsCount: {
            decrement: 1,
          },
          lastPostId: lastPost?.id || post.topic.firstPostId,
        },
      });
    });

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
export default router;