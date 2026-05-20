import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
export async function sessionTracker(req, res, next) {
  try {
    console.log("SESSION TRACKER HIT:", req.method, req.originalUrl);
    let sessionId = req.cookies.sessionId;
    console.log("COOKIE SESSION:", sessionId);

    if (!sessionId) {
      sessionId = randomUUID();

      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });
    }

    let userId = null;

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        userId = null;
      }
    }

    await prisma.session.upsert({
      where: { sessionId },
      update: {
        userId,
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
        currentPath: req.originalUrl,
        lastActivity: new Date(),
      },
      create: {
        sessionId,
        userId,
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
        currentPath: req.originalUrl,
        lastActivity: new Date(),
      },
    });
  } catch (err) {
    console.log("Session tracker error:", err.message);
  }

  next();
}