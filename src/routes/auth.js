import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/authRequired.js";

const router = Router();

router.get("/latest", async (req, res) => {
  try {
    const latestUser = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    if (!latestUser) {
      return res.status(404).json({ error: "No users found" });
    }

    res.json(latestUser);
  } catch (err) {
    console.error("Error fetching latest user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/count", async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ count });
  } catch (err) {
    console.error("Error counting users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/change-password", authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ message: "Password updated successfully ✅" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Server error." });
  }
});
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const defaultGroup = await prisma.group.findFirst({
      where: {
        isDefault: true,
      },
    });

    if (!defaultGroup) {
      return res.status(500).json({ error: "Default group not found" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        groupId: defaultGroup.id,
      },
      include: {
        group: true,
      },
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      group: user.group,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: {
        group: true,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
        group: user.group,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;