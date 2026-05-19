
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
const router = Router();
const groupSelect = {
    id: true,
    name: true,
    slug: true,
    color: true,
    isStaff: true,
};
router.get("/", optionalAuth, async (req, res) => {
    try {
        const [
            categories,
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
                            group: {
                                select: groupSelect,
                            },
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
                group: {
                    select: groupSelect,
                },
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

        let allowedForumIds = new Set();

        if (req.user?.id) {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    groupId: true,
                    group: {
                        select: {
                            isStaff: true,
                        },
                    },
                },
            });

            if (user?.group?.isStaff) {
                allowedForumIds = new Set(
                    categories.flatMap((category) =>
                        category.forums.map((forum) => forum.id)
                    )
                );
            } else if (user?.groupId) {
                const permissions = await prisma.groupForumPermission.findMany({
                    where: {
                        groupId: user.groupId,
                        canView: true,
                    },
                    select: {
                        forumId: true,
                    },
                });

                allowedForumIds = new Set(permissions.map((p) => p.forumId));
            }
        }

        const filteredCategories = categories
            .map((category) => ({
                ...category,
                forums: category.forums.filter((forum) =>
                    allowedForumIds.has(forum.id)
                ),
            }))
            .filter((category) => category.forums.length > 0);

        const visibleForumIds = new Set(
            filteredCategories.flatMap((category) =>
                category.forums.map((forum) => forum.id)
            )
        );

        const recentTopics = await prisma.topic.findMany({
            take: 5,
            where: {
                forumId: {
                    in: Array.from(visibleForumIds),
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                author: {
                    select: {
                        username: true,
                        profilePicture: true,
                        group: {
                            select: groupSelect,
                        },
                    },
                },
            },
        });

        const recentPosts = await prisma.post.findMany({
            take: 5,
            where: {
                topic: {
                    forumId: {
                        in: Array.from(visibleForumIds),
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                author: {
                    select: {
                        username: true,
                        profilePicture: true,
                        group: {
                            select: groupSelect,
                        },
                    },
                },
                topic: {
                    select: {
                        id: true,
                        title: true,
                        forumId: true,
                    },
                },
            },
        });

        const filteredLatestPosts = Array.from(latestPostsMap.values()).filter((item) =>
            visibleForumIds.has(item.forum.id)
        );

        res.json({
            categories: filteredCategories,
            topics: recentTopics,
            posts: recentPosts,
            latestPosts: filteredLatestPosts,
            topPosters: topPostersFormatted,
            messagesCount,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load home data" });
    }
});

export default router;