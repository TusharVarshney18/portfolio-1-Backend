import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.");
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { email } });

  if (existing) {
    console.log(`[seed] Admin "${email}" already exists — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.create({
    data: { email, passwordHash },
  });

  console.log(`[seed] Created admin "${email}".`);
}
