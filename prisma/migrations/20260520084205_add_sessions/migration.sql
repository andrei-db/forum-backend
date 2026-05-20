/*
  Warnings:

  - You are about to drop the column `lastActive` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "lastActive",
DROP COLUMN "location",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentPath" TEXT,
ADD COLUMN     "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Session_lastActivity_idx" ON "Session"("lastActivity");
