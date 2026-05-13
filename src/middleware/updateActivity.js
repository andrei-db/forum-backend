import { prisma } from "../db/prisma.js";

export async function updateActivity(req, res, next) {
  try {
    if (req.user) {
      await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          lastSeen: new Date(),
        },
      });
    }

    next();
  } catch (err) {
    console.error("Update activity error:", err);
    next();
  }
}