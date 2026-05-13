/*
  Warnings:

  - A unique constraint covering the columns `[firstPostId]` on the table `Topic` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lastPostId]` on the table `Topic` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "firstPostId" TEXT,
ADD COLUMN     "lastPostId" TEXT,
ADD COLUMN     "postsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Topic_firstPostId_key" ON "Topic"("firstPostId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_lastPostId_key" ON "Topic"("lastPostId");

-- CreateIndex
CREATE INDEX "Topic_firstPostId_idx" ON "Topic"("firstPostId");

-- CreateIndex
CREATE INDEX "Topic_lastPostId_idx" ON "Topic"("lastPostId");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_firstPostId_fkey" FOREIGN KEY ("firstPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_lastPostId_fkey" FOREIGN KEY ("lastPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
