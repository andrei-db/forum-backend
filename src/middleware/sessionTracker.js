import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";

export async function sessionTracker(req, res, next) {
  try {
    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
      sessionId = uuidv4();

      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 1000 * 60 * 60 * 24,
      });
    }

    let userId = null;

    const authHeader = req.headers.authorization;

    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        userId = decoded.id;
      } catch (err) {}
    }

    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.get("user-agent") || "unknown";

    await prisma.session.upsert({
      where: {
        sessionId,
      },
      update: {
        userId,
        ip,
        userAgent: ua,
        lastActive: new Date(),
      },
      create: {
        sessionId,
        userId,
        ip,
        userAgent: ua,
        lastActive: new Date(),
      },
    });

    next();
  } catch (err) {
    console.error("Session tracker error:", err);
    next();
  }
}