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
  emailPreference: 'EDUFLOW' | 'GMAIL';
  createdAt: Date;
}

function toAuthUser(user: UserRow): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailPreference: user.emailPreference,
    createdAt: user.createdAt.toISOString(),
  };
}

// Senders offered in the email settings UI. Phase 1 ships EduFlow only; Gmail
// is advertised as "coming soon" but cannot be selected yet.
const EMAIL_SENDERS = [
  { id: 'EDUFLOW' as const, label: 'Use EduFlow Email', available: true },
  { id: 'GMAIL' as const, label: 'Use Personal Gmail (OAuth)', available: false },
];

function toEmailSettings(user: { emailPreference: 'EDUFLOW' | 'GMAIL' }) {
  return { emailPreference: user.emailPreference, senders: EMAIL_SENDERS };
}

export async function getEmailSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailPreference: true },
  });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Account not found');
  }
  return toEmailSettings(user);
}

/**
 * Update the faculty's outbound email preference. Central SMTP credentials are
 * never touched — the preference only selects which server-side account is used.
 * GMAIL is reserved for Phase 2 (OAuth) and is explicitly rejected for now.
 */
export async function updateEmailSettings(
  userId: string,
  input: { emailPreference: 'EDUFLOW' | 'GMAIL' },
) {
  if (input.emailPreference !== 'EDUFLOW') {
    throw new AppError(
      501,
      'NOT_IMPLEMENTED',
      'Personal Gmail sending is not available yet. Choose "Use EduFlow Email".',
    );
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailPreference: input.emailPreference },
    select: { emailPreference: true },
  });
  return toEmailSettings(user);
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
