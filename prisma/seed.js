import { prisma } from "../src/db/prisma.js";

async function main() {
  const general = await prisma.category.create({
    data: {
      name: "General",
      description: "General discussions",
      order: 1,

      forums: {
        create: [
          {
            name: "Introductions",
            description: "Introduce yourself",
            order: 1,
          },
          {
            name: "Off Topic",
            description: "Talk about anything",
            order: 2,
          },
        ],
      },
    },
  });

  console.log(general);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });