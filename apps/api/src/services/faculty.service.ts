import bcrypt from 'bcryptjs';
import type { AuthUser } from '@eduflow/shared';
import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';

const BCRYPT_ROUNDS = 10;

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'FACULTY';
  createdAt: Date;
}

function toAuthUser(user: UserRow): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function updateProfile(
  userId: string,
  input: { name?: string; email?: string },
): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Account not found');
  }

  if (input.email) {
    const normalized = input.email.trim().toLowerCase();
    const dup = await prisma.user.findFirst({
      where: { email: normalized, NOT: { id: userId } },
    });
    if (dup) {
      throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }
    input = { ...input, email: normalized };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
  });
  return toAuthUser(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Account not found');
  }

  const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordOk) {
    throw new AppError(401, 'INVALID_PASSWORD', 'Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
