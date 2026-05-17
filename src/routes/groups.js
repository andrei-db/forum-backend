import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authRequired } from "../middleware/authRequired.js";
import { requireStaff } from "../middleware/requireStaff.js";

const router = Router();

router.get("/", authRequired, requireStaff, async (req, res) => {
    try {
        const groups = await prisma.group.findMany({
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                description: true,
                isDefault: true,
                isStaff: true,
                createdAt: true,
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });

        res.json(groups);
    } catch (err) {
        console.error("Error fetching groups:", err);
        res.status(500).json({ error: "Server error" });
    }
});
router.get("/:id", authRequired, requireStaff, async (req, res) => {
    try {
        const group = await prisma.group.findUnique({
            where: {
                id: req.params.id,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                description: true,
                isDefault: true,
                isStaff: true,
                createdAt: true,
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        res.json(group);
    } catch (err) {
        console.error("Get group error:", err);
        res.status(500).json({ error: "Server error" });
    }
});
router.get("/:id/forum-permissions", authRequired, requireStaff, async (req, res) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        forums: {
          orderBy: { order: "asc" },
          include: {
            groupPermissions: {
              where: {
                groupId: req.params.id,
              },
            },
          },
        },
      },
    });

    const data = categories.map((category) => ({
      id: category.id,
      name: category.name,
      forums: category.forums.map((forum) => {
        const permission = forum.groupPermissions[0];

        return {
          id: forum.id,
          name: forum.name,
          permissions: {
            canView: permission?.canView || false,
            canRead: permission?.canRead || false,
            canPostTopic: permission?.canPostTopic || false,
            canReply: permission?.canReply || false,
          },
        };
      }),
    }));

    res.json({
      group,
      categories: data,
    });
  } catch (err) {
    console.error("Get group permissions error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.put("/:id/forum-permissions", authRequired, requireStaff, async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: "Invalid permissions" });
    }

    await prisma.$transaction(
      permissions.map((item) =>
        prisma.groupForumPermission.upsert({
          where: {
            groupId_forumId: {
              groupId: req.params.id,
              forumId: item.forumId,
            },
          },
          update: {
            canView: Boolean(item.canView),
            canRead: Boolean(item.canRead),
            canPostTopic: Boolean(item.canPostTopic),
            canReply: Boolean(item.canReply),
          },
          create: {
            groupId: req.params.id,
            forumId: item.forumId,
            canView: Boolean(item.canView),
            canRead: Boolean(item.canRead),
            canPostTopic: Boolean(item.canPostTopic),
            canReply: Boolean(item.canReply),
          },
        })
      )
    );

    res.json({ message: "Permissions updated" });
  } catch (err) {
    console.error("Update group permissions error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/", authRequired, requireStaff, async (req, res) => {
    try {
        const {
            name,
            slug,
            color,
            description,
            isStaff,
            isDefault,
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                error: "Group name is required",
            });
        }

        if (!slug?.trim()) {
            return res.status(400).json({
                error: "Group slug is required",
            });
        }

        const existing = await prisma.group.findFirst({
            where: {
                OR: [
                    { name: name.trim() },
                    { slug: slug.trim() },
                ],
            },
        });

        if (existing) {
            return res.status(400).json({
                error: "Group already exists",
            });
        }
        if (isDefault) {
            await prisma.group.updateMany({
                where: {
                    isDefault: true,
                },
                data: {
                    isDefault: false,
                },
            });
        }

        const group = await prisma.group.create({
            data: {
                name: name.trim(),
                slug: slug.trim().toLowerCase(),
                color: color?.trim() || "text-neutral-300",
                description: description?.trim() || null,
                isStaff: Boolean(isStaff),
                isDefault: Boolean(isDefault),
            },
        });

        res.status(201).json(group);
    } catch (err) {
        console.error("Create group error:", err);

        res.status(500).json({
            error: "Server error",
        });
    }
});
router.patch("/:id", authRequired, requireStaff, async (req, res) => {
    try {
        const {
            name,
            slug,
            color,
            description,
            isStaff,
            isDefault,
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                error: "Group name is required",
            });
        }

        if (!slug?.trim()) {
            return res.status(400).json({
                error: "Group slug is required",
            });
        }

        const cleanSlug = slug.trim().toLowerCase();

        const existing = await prisma.group.findFirst({
            where: {
                AND: [
                    {
                        id: {
                            not: req.params.id,
                        },
                    },
                    {
                        OR: [
                            { name: name.trim() },
                            { slug: cleanSlug },
                        ],
                    },
                ],
            },
        });

        if (existing) {
            return res.status(400).json({
                error: "Another group already uses this name or slug",
            });
        }

        const group = await prisma.$transaction(async (tx) => {
            if (isDefault) {
                await tx.group.updateMany({
                    where: {
                        isDefault: true,
                    },
                    data: {
                        isDefault: false,
                    },
                });
            }

            return tx.group.update({
                where: {
                    id: req.params.id,
                },
                data: {
                    name: name.trim(),
                    slug: cleanSlug,
                    color: color?.trim() || "text-neutral-300",
                    description: description?.trim() || null,
                    isStaff: Boolean(isStaff),
                    isDefault: Boolean(isDefault),
                },
            });
        });

        res.json(group);
    } catch (err) {
        console.error("Update group error:", err);

        res.status(500).json({
            error: "Server error",
        });
    }
});
router.delete("/:id", authRequired, requireStaff, async (req, res) => {
    try {
        const group = await prisma.group.findUnique({
            where: {
                id: req.params.id,
            },
            include: {
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });

        if (!group) {
            return res.status(404).json({
                error: "Group not found",
            });
        }

        if (group.isDefault) {
            return res.status(400).json({
                error: "Default group cannot be deleted",
            });
        }

        if (group._count.users > 0) {
            return res.status(400).json({
                error: "Group still has members",
            });
        }

        await prisma.group.delete({
            where: {
                id: req.params.id,
            },
        });

        res.json({
            message: "Group deleted",
        });
    } catch (err) {
        console.error("Delete group error:", err);

        res.status(500).json({
            error: "Server error",
        });
    }
});

export default router;