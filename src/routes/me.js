import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

router.get("/", authRequired, async (req, res) => {
  const me = await User.findById(req.user.id).select("_id username email role profilePicture createdAt");
  res.json(me);
});

export default router;
