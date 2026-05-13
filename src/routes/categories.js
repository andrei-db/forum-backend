import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        order: "asc",
      },
      include: {
        forums: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const lastCategory = await prisma.category.findFirst({
      orderBy: {
        order: "desc",
      },
    });

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        order: lastCategory ? lastCategory.order + 1 : 0,
      },
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err);

    if (err.code === "P2002") {
      return res.status(409).json({ error: "Category already exists" });
    }

    res.status(500).json({ error: "Server error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    await prisma.category.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Category deleted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error",
    });
  }
});
export default router;