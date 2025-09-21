import { Router } from "express";
import Category from "../models/Category.js";
import { authRequired } from "../middleware/auth.js";
import Forum from "../models/Forum.js";
const router = Router();

router.get("/", async (req, res) => {
  const categories = await Category.find().sort({ order: 1 });
  const result = [];
  for (const cat of categories) {
    const forums = await Forum.find({ category: cat._id }).sort({ order: 1 });
    result.push({ ...cat.toObject(), forums });
  }
  res.json(result);
});

router.post("/", authRequired, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const category = await Category.create(req.body);
  res.status(201).json(category);
});

export default router;
