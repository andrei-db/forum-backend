import { Router } from "express";
import { authRequired } from "../middleware/authRequired.js";
import { prisma } from "../db/prisma.js";
import { storage } from "../config/cloudinary.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage });

router.post("/profile-picture", authRequired, upload.single("image"), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const user = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        profilePicture: req.file.path,
      },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        createdAt: true,
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            isStaff: true,
            isDefault: true
          },
        },
      },
    });

    res.json({ message: "Profile picture updated", user });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", authRequired, async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        createdAt: true,
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            isStaff: true,
            isDefault: true
          },
        },
      },
    });

    if (!me) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(me);
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;