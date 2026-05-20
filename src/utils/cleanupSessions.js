import { prisma } from "../db/prisma.js";
export async function cleanupOldSessions() {
  try {
    await prisma.session.deleteMany({
      where: {
        lastActivity: {
          lt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      },
    });
  } catch (err) {
    console.log("Cleanup sessions error:", err.message);
  }
}