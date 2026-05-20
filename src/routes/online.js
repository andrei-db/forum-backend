import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const activeSince = new Date(Date.now() - 1000 * 60 * 15);

    const sessions = await prisma.session.findMany({
      where: {
        lastActivity: {
          gte: activeSince,
        },
      },
      select: {
        userId: true,
        currentPath: true,
        lastActivity: true,
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            group: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                isStaff: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastActivity: "desc",
      },
    });

    const membersMap = new Map();
    let guestsCount = 0;

    for (const session of sessions) {
      if (session.user) {
        membersMap.set(session.user.id, {
          ...session.user,
          currentPath: session.currentPath,
          lastActivity: session.lastActivity,
        });
      } else {
        guestsCount++;
      }
    }

    const members = Array.from(membersMap.values());

    res.json({
      members,
      membersCount: members.length,
      guestsCount,
      totalOnline: members.length + guestsCount,
    });
  } catch (err) {
    console.error("Online error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;