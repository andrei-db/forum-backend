import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/authRequired.js";
import { requireStaff } from "../middleware/requireStaff.js";

const router = Router();

const defaultSettings = {
  forumName: "Forum MVP",
  forumDescription: "A modern community forum.",
  registrationEnabled: "true",
  topicsPerPage: "20",
  postsPerPage: "10",
  maintenanceMode: "false",
};

router.get("/", authRequired, requireStaff, async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();

    const result = { ...defaultSettings };

    settings.forEach((setting) => {
      result[setting.key] = setting.value;
    });

    res.json(result);
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/", authRequired, requireStaff, async (req, res) => {
  try {
    const settings = req.body;

    await prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    res.json({ message: "Settings updated" });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.get("/public", async (req, res) => {
  const settings = await prisma.setting.findMany();

  const result = {
    forumName: "Forum MVP",
    forumDescription: "A modern community forum.",
    registrationEnabled: "true",
    maintenanceMode: "false",
  };

  settings.forEach((setting) => {
    result[setting.key] = setting.value;
  });

  res.json(result);
});
export default router;