import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@eduflow/shared';
import { getConfig } from '../config.js';
import { AppError } from '../middleware/error.js';

export interface DecodedToken {
  sub: string;
  role: Role;
  /** Unique token id — persisted in the RefreshToken table for revocation. */
  jti: string;
}

interface TokenPayload extends jwt.JwtPayload {
  type: 'access' | 'refresh';
  role: Role;
  jti?: string;
}

export function signAccessToken(userId: string, role: Role): string {
  const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL } = getConfig();
  return jwt.sign({ type: 'access', role, sub: userId }, ACCESS_TOKEN_SECRET, {
    // TTL strings ("60m", "7d") are validated by the zod config schema; the
    // jsonwebtoken types accept them via ms.StringValue, which a plain string
    // does not structurally match.
    expiresIn: ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(
  userId: string,
  role: Role,
): { token: string; jti: string } {
  const jti = randomUUID();
  const { REFRESH_TOKEN_SECRET, REFRESH_TOKEN_TTL } = getConfig();
  const token = jwt.sign({ type: 'refresh', role, sub: userId, jti }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });
  return { token, jti };
}

/**
 * Read the `jti` and expiry back out of a just-issued refresh token (unverified
 * decode — the token was signed milliseconds ago by `signRefreshToken`). Used
 * to persist the DB row that backs server-side revocation.
 */
export function decodeRefreshToken(token: string): { jti: string; expiresAt: Date } {
  const payload = jwt.decode(token) as jwt.JwtPayload | null;
  if (!payload || typeof payload.jti !== 'string' || typeof payload.exp !== 'number') {
    throw new AppError(401, 'INVALID_TOKEN', 'Session is invalid or has expired');
  }
  return { jti: payload.jti, expiresAt: new Date(payload.exp * 1000) };
}

export function verifyAccessToken(token: string): DecodedToken {
  return verifyToken(token, 'access', getConfig().ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token: string): DecodedToken {
  return verifyToken(token, 'refresh', getConfig().REFRESH_TOKEN_SECRET);
}

function verifyToken(token: string, expectedType: 'access' | 'refresh', secret: string): DecodedToken {
  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, secret) as TokenPayload;
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Session is invalid or has expired');
  }

  const { sub, role } = payload;
  const validRole = role === 'ADMIN' || role === 'FACULTY';
  if (payload.type !== expectedType || typeof sub !== 'string' || !validRole) {
    throw new AppError(401, 'INVALID_TOKEN', 'Session is invalid or has expired');
  }
  // Refresh tokens must carry a jti so they can be revoked server-side; access
  // tokens are stateless and never include one.
  if (expectedType === 'refresh' && typeof payload.jti !== 'string') {
    throw new AppError(401, 'INVALID_TOKEN', 'Session is invalid or has expired');
  }
  return { sub, role, jti: payload.jti ?? '' };
}
