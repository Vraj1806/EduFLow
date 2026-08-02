import bcrypt from 'bcryptjs';
import type { AuthUser, LoginInput, RegisterInput } from '@eduflow/shared';
import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './token.service.js';

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

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** Issue a fresh access + refresh token pair for a user. */
export function issueSession(user: AuthUser): SessionTokens {
  return {
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: signRefreshToken(user.id, user.role),
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, name: input.name.trim(), passwordHash, role: 'FACULTY' },
  });
  return toAuthUser(user);
}

export async function authenticate(input: LoginInput): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Same message for unknown email and wrong password — don't leak which is which.
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordOk) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  return toAuthUser(user);
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toAuthUser(user) : null;
}

/** Rotate a session from a valid refresh token (refresh rotation on every use). */
export async function refreshSession(
  refreshToken: string,
): Promise<{ user: AuthUser; tokens: SessionTokens }> {
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError(401, 'SESSION_EXPIRED', 'Session is no longer valid');
  }
  const authUser = toAuthUser(user);
  return { user: authUser, tokens: issueSession(authUser) };
}
