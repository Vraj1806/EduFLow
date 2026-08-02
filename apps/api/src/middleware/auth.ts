import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@eduflow/shared';
import { verifyAccessToken } from '../services/token.service.js';
import { AppError } from './error.js';

const ACCESS_COOKIE = 'access_token';

/** Requires a valid access-token cookie; attaches `req.user` on success. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies[ACCESS_COOKIE];
  if (typeof token !== 'string' || token.length === 0) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'INVALID_TOKEN', 'Session is invalid or has expired'));
  }
}

/** Requires `req.user` to have one of the given roles. Use after `requireAuth`. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
      return;
    }
    next();
  };
}
