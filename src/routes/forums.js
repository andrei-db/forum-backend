import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/authRequired.js";
import { requireStaff } from "../middleware/requireStaff.js";

const router = Router();
router.patch("/reorder", authRequired, requireStaff, async (req, res) => {

    try {
        const { forums } = req.body;

        if (!Array.isArray(forums)) {
            return res.status(400).json({ error: "Invalid forums order" });
        }

        await prisma.$transaction(
            forums.map((forum, index) =>
                prisma.forum.update({
                    where: { id: forum.id },
                    data: { order: index },
                })
            )
        );

        res.json({ message: "Forums reordered" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
router.get("/:id/topics-with-last-reply", async (req, res) => {
    try {
        const topics = await prisma.topic.findMany({
            where: {
                forumId: req.params.id,
            },
            orderBy: [
                { sticky: "desc" },
                { createdAt: "desc" },
            ],
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        group: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                color: true,
                                isStaff: true,
                            },
                        },
                        profilePicture: true,
                    },
                },
                posts: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 1,
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                group: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                        color: true,
                                        isStaff: true,
                                    },
                                },
                                profilePicture: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
        });

        const topicsWithData = topics.map((topic) => {
            const { posts, _count, ...rest } = topic;

            return {
                ...rest,
                lastReply: posts[0] || null,
                replies: _count.posts > 0 ? _count.posts - 1 : 0,
            };
        });

        res.json(topicsWithData);
    } catch (err) {
        console.error("Error fetching topics with last reply:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/messages-count", async (req, res) => {
    try {
        const counts = await prisma.post.groupBy({
            by: ["topicId"],
            _count: {
                id: true,
            },
        });

        const topics = await prisma.topic.findMany({
            select: {
                id: true,
                forumId: true,
            },
        });

        const topicToForum = new Map(topics.map((topic) => [topic.id, topic.forumId]));

        const forumCounts = {};

        counts.forEach((item) => {
            const forumId = topicToForum.get(item.topicId);
            if (!forumId) return;

            forumCounts[forumId] = (forumCounts[forumId] || 0) + item._count.id;
        });

        const result = Object.entries(forumCounts).map(([forumId, messagesCount]) => ({
            id: forumId,
            messagesCount,
        }));

        res.json(result);
    } catch (err) {
        console.error("Error counting messages:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/latest-posts", async (req, res) => {
    try {
        const forums = await prisma.forum.findMany();

        const results = await Promise.all(
            forums.map(async (forum) => {
                const post = await prisma.post.findFirst({
                    where: {
                        topic: {
                            forumId: forum.id,
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                group: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                        color: true,
                                        isStaff: true,
                                    },
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

                return {
                    forum,
                    lastPost: post
                        ? {
                            id: post.id,
                            content: post.content,
                            createdAt: post.createdAt,
                            topic: {
                                id: post.topic.id,
                                title: post.topic.title,
                            },
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
        const topics = await prisma.topic.findMany({
            where: {
                forumId: req.params.id,
            },
            orderBy: [
                { sticky: "desc" },
                { createdAt: "desc" },
            ],
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        group: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                color: true,
                                isStaff: true,
                            },
                        },
                        profilePicture: true,
                    },
                },
            },
        });

        res.json(topics);
    } catch (err) {
        console.error("Error fetching topics:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const forum = await prisma.forum.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
            },
        });

        if (!forum) {
            return res.status(404).json({ error: "Forum not found" });
        }

        res.json(forum);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/", authRequired, requireStaff, async (req, res) => {

    try {
        const {
            name,
            description,
            categoryId,
            type,
            redirectUrl,
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                error: "Forum name is required",
            });
        }

        if (!categoryId) {
            return res.status(400).json({
                error: "Category is required",
            });
        }

        if (type === "redirect" && !redirectUrl?.trim()) {
            return res.status(400).json({
                error: "Redirect URL is required",
            });
        }

        const lastForum = await prisma.forum.findFirst({
            where: {
                categoryId,
            },
            orderBy: {
                order: "desc",
            },
        });

        const result = await prisma.$transaction(async (tx) => {
            const forum = await tx.forum.create({
                data: {
                    name: name.trim(),
                    description: description?.trim() || null,
                    categoryId,
                    order: lastForum ? lastForum.order + 1 : 0,
                    type: type || "discussion",
                    redirectUrl: type === "redirect" ? redirectUrl.trim() : null,
                },
            });

            const groups = await tx.group.findMany();

            await tx.groupForumPermission.createMany({
                data: groups.map((group) => {
                    const isBanned = group.slug === "banned";

                    return {
                        groupId: group.id,
                        forumId: forum.id,
                        canView: !isBanned,
                        canRead: !isBanned,
                        canPostTopic: !isBanned,
                        canReply: !isBanned,
                    };
                }),
            });

            return forum;
        });

        res.status(201).json(result);

        res.status(201).json(forum);
    } catch (err) {
        console.error("Error creating forum:", err);

        res.status(400).json({
            error: err.message,
        });
    }
});
router.delete("/:id", authRequired, requireStaff, async (req, res) => {

    try {
        await prisma.forum.delete({
            where: {
                id: req.params.id,
            },
        });

        res.json({ message: "Forum deleted" });
    } catch (err) {
        console.error("Error deleting forum:", err);
        res.status(500).json({ error: "Server error" });
    }
});
router.patch("/:id", authRequired, requireStaff, async (req, res) => {

    try {
        const { name, description, categoryId, type, redirectUrl, order } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ error: "Forum name is required" });
        }

        if (!categoryId) {
            return res.status(400).json({ error: "Category is required" });
        }

        if (type === "redirect" && !redirectUrl?.trim()) {
            return res.status(400).json({ error: "Redirect URL is required" });
        }

        const forum = await prisma.forum.update({
            where: { id: req.params.id },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                categoryId,
                type: type || "discussion",
                redirectUrl: type === "redirect" ? redirectUrl.trim() : null
            },
        });

        res.json(forum);
    } catch (err) {
        res.status(500).json({ error: err.message || "Server error" });
    }
});
export default router;