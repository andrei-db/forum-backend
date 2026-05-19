import { prisma } from "../db/prisma.js";

export async function getForumPermission(userId, forumId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      groupId: true,
      group: {
        select: {
          id: true,
          isStaff: true,
        },
      },
    },
  });

  if (!user || !user.groupId) {
    return null;
  }

  const permission = await prisma.groupForumPermission.findUnique({
    where: {
      groupId_forumId: {
        groupId: user.groupId,
        forumId,
      },
    },
  });

  return {
    user,
    permission,
  };
}
export async function canViewForum(req, forumId) {
  if (!req.user?.id) return false;

  const access = await getForumPermission(req.user.id, forumId);

  return Boolean(
    access?.permission?.canView || access?.user?.group?.isStaff
  );
}
export async function canReadForum(req, forumId) {
  if (!req.user?.id) return false;

  const access = await getForumPermission(req.user.id, forumId);

  return Boolean(
    access?.permission?.canRead || access?.user?.group?.isStaff
  );
}
export async function canPostTopic(req, forumId) {
  if (!req.user?.id) return false;

  const access = await getForumPermission(req.user.id, forumId);

  return Boolean(
    access?.permission?.canPostTopic ||
    access?.user?.group?.isStaff
  );
}

export async function canReplyForum(req, forumId) {
  if (!req.user?.id) return false;

  const access = await getForumPermission(req.user.id, forumId);

  return Boolean(
    access?.permission?.canReply ||
    access?.user?.group?.isStaff
  );
}