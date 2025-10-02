import { Router } from "express";
import Session from "../models/Session.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000); 

    const sessions = await Session.find({ lastActive: { $gt: cutoff } })
      .populate("userId", "username profilePicture role");

    const memberMap = new Map();
    sessions.forEach((s) => {
      if (s.userId) {
        memberMap.set(s.userId._id.toString(), s.userId);
      }
    });
    const members = Array.from(memberMap.values());

    const guests = sessions.filter((s) => !s.userId).length;

    res.json({ members, guests });
  } catch (err) {
    console.error("Error fetching online users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
