const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "General", color: "#3B82F6" },
  { name: "Finance", color: "#14B8A6" },
  { name: "Legal", color: "#F97316" },
  { name: "Marketing", color: "#A855F7" }
];

async function main() {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        name: category.name
      },
      update: {
        color: category.color
      },
      create: {
        name: category.name,
        color: category.color
      }
    });
  }

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);
}

main()
  .catch((error) => {
    console.error("Failed to seed database", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
