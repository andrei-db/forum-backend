import { prisma } from "../src/db/prisma.js";
async function main() {
  const groups = [
    {
      name: "Members",
      slug: "members",
      color: "text-neutral-300",
      isDefault: true,
      isStaff: false,
    },
    {
      name: "Administrators",
      slug: "administrators",
      color: "text-red-400",
      isDefault: false,
      isStaff: true,
    },
    {
      name: "Moderators",
      slug: "moderators",
      color: "text-blue-400",
      isDefault: false,
      isStaff: true,
    },
  ];

  for (const group of groups) {
    await prisma.group.upsert({
      where: { slug: group.slug },
      update: group,
      create: group,
    });
  }

  console.log("Groups seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());