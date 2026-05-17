import { prisma } from "../db/prisma.js";

export async function requireStaff(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      include: {
        group: true,
      },
    });

    if (!user?.group?.isStaff) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    req.userData = user;

    next();
  } catch (err) {
    console.error("Staff middleware error:", err);

    res.status(500).json({
      error: "Server error",
    });
  }
}