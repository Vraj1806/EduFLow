import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.');
    return;
  }

  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    console.log(`Admin already exists: ${normalized}`);
    return;
  }

  await prisma.user.create({
    data: {
      email: normalized,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      name: process.env.ADMIN_NAME?.trim() || 'Administrator',
      role: 'ADMIN',
    },
  });
  console.log(`Seeded admin user: ${normalized}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
