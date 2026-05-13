import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

router.get("/:username", async (req, res) => {
  try {
    const member = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        role: true,
        createdAt: true,
        lastSeen: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: "User not found" });
    }

    const { _count, ...userData } = member;

    res.json({
      ...userData,
      postsCount: _count.posts,
    });
  } catch (err) {
    console.error("Error fetching user by username:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;