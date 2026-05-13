import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000);

    const sessions = await prisma.session.findMany({
      where: {
        lastActive: {
          gt: cutoff,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            role: true,
          },
        },
      },
    });

    const memberMap = new Map();

    sessions.forEach((s) => {
      if (s.user) {
        memberMap.set(s.user.id, {
          ...s.user,
        });
      }
    });

    const members = Array.from(memberMap.values());

    const guests = sessions.filter((s) => !s.user).length;

    res.json({ members, guests });
  } catch (err) {
    console.error("Error fetching online users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;