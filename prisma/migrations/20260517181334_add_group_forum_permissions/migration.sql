-- CreateTable
CREATE TABLE "GroupForumPermission" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canPostTopic" BOOLEAN NOT NULL DEFAULT false,
    "canReply" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GroupForumPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupForumPermission_groupId_forumId_key" ON "GroupForumPermission"("groupId", "forumId");

-- AddForeignKey
ALTER TABLE "GroupForumPermission" ADD CONSTRAINT "GroupForumPermission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupForumPermission" ADD CONSTRAINT "GroupForumPermission_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
