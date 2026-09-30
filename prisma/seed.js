import { prisma } from "../lib/prisma.js";
import { ensureAdmin } from "../lib/seed.js";

async function main() {
  await ensureAdmin();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
