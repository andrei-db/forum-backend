import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/authRequired.js";
import bcrypt from "bcrypt";
import { requireStaff } from "../middleware/requireStaff.js";
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
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            isStaff: true,
          },
        },
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
router.post("/", authRequired, requireStaff, async (req, res) => {


  try {
    const { username, email, password, groupId } = req.body;

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
    const defaultGroup = await prisma.group.findFirst({
      where: { isDefault: true },
    });

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim(),
        passwordHash,
        groupId: groupId || defaultGroup?.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
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
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("Error creating member:", err);
    res.status(400).json({ error: err.message });
  }
});
router.delete("/:id", authRequired, requireStaff, async (req, res) => {


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
router.get("/id/:id", authRequired, requireStaff, async (req, res) => {

  try {
    const member = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        email: true,
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
        online: true,
        createdAt: true,
        lastSeen: true,
        _count: {
          select: {
            posts: true,
            topics: true,
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json({
      ...member,
      postsCount: member._count.posts,
      topicsCount: member._count.topics,
    });
  } catch (err) {
    console.error("Error fetching member:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.patch("/id/:id", authRequired, requireStaff, async (req, res) => {

  try {
    const { username, email, groupId, profilePicture, password } = req.body;
    const data = {};

    if (username?.trim()) data.username = username.trim();
    if (email?.trim()) data.email = email.trim();
    if (profilePicture !== undefined) data.profilePicture = profilePicture.trim();
    if (groupId) data.groupId = groupId;

    if (password?.trim()) {
      data.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const member = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
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
        createdAt: true,
        lastSeen: true,
        online: true,
      },
    });

    res.json(member);
  } catch (err) {
    console.error("Error updating member:", err);
    res.status(400).json({ error: err.message });
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
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            isStaff: true,
          },
        },
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