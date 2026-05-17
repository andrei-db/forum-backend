import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/authRequired.js";
import { requireStaff } from "../middleware/requireStaff.js";

const router = Router();
const groupSelect = {
    id: true,
    name: true,
    slug: true,
    color: true,
    isStaff: true,
};
router.patch("/:id/sticky", authRequired, requireStaff, async (req, res) => {
    try {
        const existingTopic = await prisma.topic.findUnique({
            where: { id: req.params.id },
        });

        if (!existingTopic) {
            return res.status(404).json({ error: "Topic not found" });
        }

        const topic = await prisma.topic.update({
            where: { id: req.params.id },
            data: {
                sticky: !existingTopic.sticky,
            },
        });

        res.json({
            message: `Topic is now ${topic.sticky ? "sticky" : "normal"}`,
            topic,
        });
    } catch (err) {
        console.error("Sticky error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.patch("/:id/closed", authRequired, requireStaff, async (req, res) => {
    try {
        const existingTopic = await prisma.topic.findUnique({
            where: { id: req.params.id },
        });

        if (!existingTopic) {
            return res.status(404).json({ error: "Topic not found" });
        }

        const topic = await prisma.topic.update({
            where: { id: req.params.id },
            data: {
                closed: !existingTopic.closed,
            },
        });

        res.json({
            message: `Topic is now ${topic.closed ? "closed" : "open"}`,
            topic,
        });
    } catch (err) {
        console.error("Closed error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/count", async (req, res) => {
    try {
        const count = await prisma.topic.count();

        res.json({ count });
    } catch (err) {
        console.error("Error counting topics:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/recent", async (req, res) => {
    try {
        const topics = await prisma.topic.findMany({
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
            },
        });

        res.json(topics);
    } catch (err) {
        console.error("Error fetching recent topics:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const topic = await prisma.topic.findUnique({
            where: {
                id: req.params.id,
            },

            include: {
                forum: {
                    include: {
                        category: true,
                    },
                },
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
                posts: {
                    orderBy: {
                        createdAt: "asc",
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
                    },
                },
            },
        });

        if (!topic) {
            return res.status(404).json({ error: "Topic not found" });
        }

        res.json(topic);
    } catch (err) {
        console.error("Error fetching topic:", err);
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/", authRequired, async (req, res) => {
    try {
        const { forum, forumId, title, content } = req.body;

        const finalForumId = forumId || forum;
        const cleanTitle = title?.trim();
        const cleanContent = content?.trim();

        if (!finalForumId || !cleanTitle || !cleanContent || !req.user?.id) {
            return res.status(400).json({
                error: "Missing fields",
                debug: {
                    finalForumId,
                    title,
                    content,
                    userId: req.user?.id,
                },
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            const topic = await tx.topic.create({
                data: {
                    forumId: finalForumId,
                    title: cleanTitle,
                    authorId: req.user.id,
                },
            });

            const firstPost = await tx.post.create({
                data: {
                    topicId: topic.id,
                    content: cleanContent,
                    authorId: req.user.id,
                },
            });

            return await tx.topic.update({
                where: { id: topic.id },
                data: {
                    firstPostId: firstPost.id,
                    lastPostId: firstPost.id,
                    postsCount: 1,
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
                    posts: true,
                    firstPost: true,
                    lastPost: true,
                },
            });
        });

        res.status(201).json(result);
    } catch (err) {
        console.error("Error creating topic:", err);
        res.status(400).json({ error: err.message });
    }
});

export default router;