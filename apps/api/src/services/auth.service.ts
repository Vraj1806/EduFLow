import bcrypt from 'bcryptjs';
import type { AuthUser, LoginInput, RegisterInput } from '@eduflow/shared';
import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';
import {
  decodeRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './token.service.js';

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

/**
 * Issue a fresh access + refresh token pair for a user and persist a row for
 * the refresh token's `jti` so it can be revoked server-side on logout/rotation.
 */
export async function issueSession(user: AuthUser): Promise<SessionTokens> {
  const accessToken = signAccessToken(user.id, user.role);
  const { token: refreshToken, jti } = signRefreshToken(user.id, user.role);

  const { expiresAt } = decodeRefreshToken(refreshToken);
  await prisma.refreshToken.create({
    data: { jti, userId: user.id, expiresAt },
  });

  return { accessToken, refreshToken };
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

  // Reject if the token was never persisted, was revoked, or has expired — this
  // is what makes logout actually invalidate the session server-side.
  const row = await prisma.refreshToken.findUnique({ where: { jti: payload.jti } });
  if (!row || row.revokedAt !== null || row.expiresAt < new Date()) {
    throw new AppError(401, 'SESSION_EXPIRED', 'Session is no longer valid');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError(401, 'SESSION_EXPIRED', 'Session is no longer valid');
  }

  // Rotation-on-use: revoke the presented token, then issue a brand-new pair.
  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });

  const authUser = toAuthUser(user);
  const tokens = await issueSession(authUser);
  return { user: authUser, tokens };
}

/**
 * Revoke a refresh token server-side (used by logout). Invalid/expired tokens
 * are ignored — clearing the cookies is sufficient for those.
 */
export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { jti: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Nothing to revoke — the token is already invalid.
  }
}

/**
 * Delete expired refresh-token rows so the table does not grow unbounded. Run
 * periodically from the background worker; returns the number of rows removed.
 */
export async function cleanupExpiredRefreshTokens(now: Date = new Date()): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return result.count;
}
