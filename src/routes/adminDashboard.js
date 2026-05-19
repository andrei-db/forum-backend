import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/authRequired.js";
import { requireStaff } from "../middleware/requireStaff.js";

const router = Router();

router.get("/", authRequired, requireStaff, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      membersCount,
      topicsCount,
      postsCount,
      forumsCount,
      groups,
      recentTopics,
      recentPosts,
      postsLast7Days,
      topicsLast7Days,
      topForumsRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.topic.count(),
      prisma.post.count(),
      prisma.forum.count(),

      prisma.group.findMany({
        select: {
          name: true,
          _count: {
            select: {
              users: true,
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
              group: {
                select: {
                  color: true,
                },
              },
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
              group: {
                select: {
                  color: true,
                },
              },
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

      prisma.post.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          createdAt: true,
        },
      }),

      prisma.topic.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          createdAt: true,
        },
      }),

      prisma.post.groupBy({
        by: ["topicId"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 20,
      }),
    ]);

    const topicIds = topForumsRaw.map((item) => item.topicId);

    const topics = await prisma.topic.findMany({
      where: {
        id: {
          in: topicIds,
        },
      },
      select: {
        id: true,
        forumId: true,
        forum: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const forumMap = new Map();

    for (const item of topForumsRaw) {
      const topic = topics.find((t) => t.id === item.topicId);
      if (!topic?.forum) continue;

      const forumId = topic.forum.id;

      if (!forumMap.has(forumId)) {
        forumMap.set(forumId, {
          id: forumId,
          name: topic.forum.name,
          posts: 0,
        });
      }

      forumMap.get(forumId).posts += item._count.id;
    }

    const topForums = Array.from(forumMap.values())
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 5);

    function buildActivity() {
      const days = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const key = date.toISOString().slice(0, 10);

        days.push({
          key,
          day: date.toLocaleDateString("en-US", {
            weekday: "short",
          }),
          posts: 0,
          topics: 0,
        });
      }

      for (const post of postsLast7Days) {
        const key = post.createdAt.toISOString().slice(0, 10);
        const day = days.find((d) => d.key === key);
        if (day) day.posts += 1;
      }

      for (const topic of topicsLast7Days) {
        const key = topic.createdAt.toISOString().slice(0, 10);
        const day = days.find((d) => d.key === key);
        if (day) day.topics += 1;
      }

      return days.map(({ key, ...rest }) => rest);
    }

    res.json({
      stats: {
        members: membersCount,
        topics: topicsCount,
        posts: postsCount,
        forums: forumsCount,
      },
      activity: buildActivity(),
      groups: groups.map((group) => ({
        name: group.name,
        value: group._count.users,
      })),
      topForums,
      recentTopics,
      recentPosts,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({
      error: "Failed to load dashboard data",
    });
  }
});

export default router;