-- CreateEnum
CREATE TYPE "ForumType" AS ENUM ('discussion', 'redirect');

-- AlterTable
ALTER TABLE "Forum" ADD COLUMN     "redirectUrl" TEXT,
ADD COLUMN     "type" "ForumType" NOT NULL DEFAULT 'discussion';
