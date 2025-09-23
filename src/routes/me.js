import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import User from "../models/User.js";
import { storage, cloudinary } from "../config/cloudinary.js";
import multer from "multer";
const router = Router();
const upload = multer({ storage });

router.post("/profile-picture", authRequired, upload.single("image"), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: req.file.path },
      { new: true }
    );

    res.json({ message: "Profile picture updated", user });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.get("/", authRequired, async (req, res) => {
  const me = await User.findById(req.user.id).select("_id username email role profilePicture createdAt");
  res.json(me);
});

export default router;
