import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/authRequired.js";
import { requireStaff } from "../middleware/requireStaff.js";
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
router.post("/",authRequired,requireStaff, async (req, res) => {
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
router.patch("/reorder", authRequired, requireStaff, async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: "Invalid categories order" });
    }

    await prisma.$transaction(
      categories.map((category, index) =>
        prisma.category.update({
          where: { id: category.id },
          data: { order: index },
        })
      )
    );

    res.json({ message: "Categories reordered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
router.delete("/:id", authRequired,requireStaff, async (req, res) => {
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
router.get("/:id", async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
router.patch("/:id", authRequired,requireStaff, async (req, res) => {

  try {
    const { name, description, order } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        order: Number(order) || 0,
      },
    });

    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;