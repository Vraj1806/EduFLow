import type { CookieOptions, RequestHandler, Response } from 'express';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getConfig } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import {
  authenticate,
  getUserById,
  issueSession,
  refreshSession,
  registerUser,
} from '../services/auth.service.js';

const router = Router();

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(128),
});

function cookieOptions(): CookieOptions {
  const cfg = getConfig();
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: cfg.COOKIE_SECURE,
    path: '/',
  };
}

function setSessionCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions());
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions());
}

function clearSessionCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

// Brute-force protection for credential endpoints. Disabled under test so suites
// can run many requests quickly.
const authLimiter: RequestHandler =
  getConfig().NODE_ENV === 'test'
    ? (_req, _res, next) => {
        next();
      }
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      });

router.post('/register', authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);
  setSessionCookies(res, issueSession(user));
  res.status(201).json({ data: { user } });
});

router.post('/login', authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await authenticate(input);
  setSessionCookies(res, issueSession(user));
  res.json({ data: { user } });
});

router.post('/logout', (_req, res) => {
  clearSessionCookies(res);
  res.status(204).end();
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE];
  if (typeof token !== 'string' || token.length === 0) {
    throw new AppError(401, 'SESSION_EXPIRED', 'No active session');
  }
  const { user, tokens } = await refreshSession(token);
  setSessionCookies(res, tokens);
  res.json({ data: { user } });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await getUserById(req.user!.id);
  if (!user) {
    throw new AppError(401, 'SESSION_EXPIRED', 'Account no longer exists');
  }
  res.json({ data: { user } });
});

export const authRouter = router;
