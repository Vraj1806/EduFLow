import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across hot reloads (tsx watch) so dev never
// exhausts connections. In production builds there is no reload, so the global
// caching is inert.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
