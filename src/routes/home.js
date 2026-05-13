
import { Router } from "express";
import { prisma } from "../db/prisma.js";
const router = Router();

router.get("/", async (req, res) => {
    try {
        const [
            categories,
            recentTopics,
            recentPosts,
            topPosters,
            latestPostsRaw,
            messagesCountRaw,
        ] = await Promise.all([
            prisma.category.findMany({
                orderBy: { order: "asc" },
                include: {
                    forums: {
                        orderBy: { order: "asc" },
                        include: {
                            _count: {
                                select: {
                                    topics: true,
                                },
                            },
                        },
                    },
                },
            }),

            prisma.topic.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    author: {
                        select: {
                            username: true,
                            profilePicture: true,
                            role: true,
                        },
                    },
                },
            }),

            prisma.post.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    author: {
                        select: {
                            username: true,
                            profilePicture: true,
                            role: true,
                        },
                    },
                    topic: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            }),

            prisma.post.groupBy({
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
            }),

            prisma.post.findMany({
                orderBy: { createdAt: "desc" },
                distinct: ["topicId"],
                include: {
                    author: {
                        select: {
                            username: true,
                            profilePicture: true,
                            role: true,
                        },
                    },
                    topic: {
                        select: {
                            id: true,
                            title: true,
                            forum: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            }),

            prisma.topic.groupBy({
                by: ["forumId"],
                _count: {
                    id: true,
                },
            }),
        ]);

        const topPostersUsers = await prisma.user.findMany({
            where: {
                id: {
                    in: topPosters.map((p) => p.authorId),
                },
            },
            select: {
                id: true,
                username: true,
                profilePicture: true,
                role: true,
            },
        });

        const topPostersFormatted = topPosters.map((p) => ({
            id: p.authorId,
            postsCount: p._count.id,
            user: topPostersUsers.find((u) => u.id === p.authorId),
        }));

        const latestPostsMap = new Map();

        for (const post of latestPostsRaw) {
            const forumId = post.topic.forum.id;

            if (!latestPostsMap.has(forumId)) {
                latestPostsMap.set(forumId, {
                    forum: {
                        id: forumId,
                    },
                    lastPost: {
                        id: post.id,
                        createdAt: post.createdAt,
                        author: post.author,
                        topic: {
                            id: post.topic.id,
                            title: post.topic.title,
                        },
                    },
                });
            }
        }

        const messagesCount = messagesCountRaw.map((item) => ({
            id: item.forumId,
            messagesCount: item._count.id,
        }));

        res.json({
            categories,
            topics: recentTopics,
            posts: recentPosts,
            topPosters: topPostersFormatted,
            latestPosts: Array.from(latestPostsMap.values()),
            messagesCount,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load home data" });
    }
});

export default router;