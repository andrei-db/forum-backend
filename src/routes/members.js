import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/auth.js";
import bcrypt from "bcrypt";
const router = Router();
router.get("/", async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        role: true,
        createdAt: true,
        lastSeen: true,
        online: true,
        _count: {
          select: {
            posts: true,
            topics: true,
          },
        },
      },
    });

    const formatted = members.map((member) => ({
      ...member,
      postsCount: member._count.posts,
      topicsCount: member._count.topics,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/", authRequired, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const { username, email, password, role } = req.body;

    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const exists = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim() },
          { username: username.trim() },
        ],
      },
    });

    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim(),
        passwordHash,
        role: role === "admin" ? "admin" : "user",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("Error creating member:", err);
    res.status(400).json({ error: err.message });
  }
});
router.delete("/:id", authRequired, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: "You cannot delete yourself" });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Member deleted" });
  } catch (err) {
    console.error("Error deleting member:", err);
    res.status(500).json({ error: "Server error" });
  }
});
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