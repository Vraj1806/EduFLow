import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { requireAuth, requireRole } from '../src/middleware/auth.js';
import { errorHandler } from '../src/middleware/error.js';

const app = createApp();

/**
 * Minimal app for exercising the role guards. Cannot reuse createApp() — its
 * notFoundHandler is mounted last, so a route added afterwards would be
 * shadowed by the 404 handler. cookieParser is required by requireAuth.
 */
function createGuardApp() {
  const guardApp = express();
  guardApp.use(express.json());
  guardApp.use(cookieParser());
  guardApp.get('/api/admin-only', requireAuth, requireRole('ADMIN'), (_req, res) => {
    res.json({ data: { ok: true } });
  });
  // Convert AppErrors (e.g. FORBIDDEN) into the JSON error envelope.
  guardApp.use(errorHandler);
  return guardApp;
}

/** Extract the value of one cookie from a Set-Cookie header array. */
function cookieValue(setCookie: string[], name: string): string {
  const header = setCookie.find((c) => c.startsWith(`${name}=`));
  if (!header) throw new Error(`Expected cookie ${name} to be set`);
  return header.split(';')[0] ?? '';
}

async function registerUser(email = 'faculty@test.com', password = 'password123', name = 'Test Faculty') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password })
    .expect(201);

  const cookies = res.headers['set-cookie'] as unknown as string[];
  return {
    user: res.body.data.user as { email: string; name: string; role: string },
    accessToken: cookieValue(cookies, 'access_token'),
    refreshToken: cookieValue(cookies, 'refresh_token'),
  };
}

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('creates a FACULTY user and sets session cookies', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane Doe', email: 'jane@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({
      email: 'jane@test.com',
      name: 'Jane Doe',
      role: 'FACULTY',
    });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
  });

  it('normalizes the email and stores a hashed password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane', email: ' JANE@Test.com ', password: 'password123' })
      .expect(201);

    const user = await prisma.user.findUnique({ where: { email: 'jane@test.com' } });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBe('password123');
    expect(await bcrypt.compare('password123', user!.passwordHash)).toBe(true);
  });

  it('rejects duplicate emails with 409', async () => {
    const payload = { name: 'Jane', email: 'jane@test.com', password: 'password123' };
    await request(app).post('/api/auth/register').send(payload).expect(201);

    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects an invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane', email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane', email: 'jane@test.com', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and sets cookies', async () => {
    await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('faculty@test.com');
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
  });

  it('rejects a wrong password with 401', async () => {
    await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty@test.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns the current user for a valid access cookie', async () => {
    const { accessToken } = await registerUser();
    const res = await request(app).get('/api/auth/me').set('Cookie', accessToken);
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: 'faculty@test.com', role: 'FACULTY' });
  });
});

describe('POST /api/auth/refresh', () => {
  it('issues a fresh access token from a valid refresh cookie', async () => {
    const { refreshToken } = await registerUser();
    const res = await request(app).post('/api/auth/refresh').set('Cookie', refreshToken);
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
  });

  it('rejects refresh without a refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('rejects refresh with a garbage refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh').set('Cookie', 'refresh_token=not-a-jwt');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session cookies', async () => {
    const { accessToken, refreshToken } = await registerUser();
    const res = await request(app).post('/api/auth/logout').set('Cookie', [accessToken, refreshToken]);

    expect(res.status).toBe(204);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('access_token=;'))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
  });
});

describe('role guards', () => {
  it('blocks a FACULTY user from an ADMIN-only route with 403', async () => {
    const { accessToken } = await registerUser();
    const res = await request(createGuardApp()).get('/api/admin-only').set('Cookie', accessToken);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows an ADMIN user on an ADMIN-only route', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: { email: 'admin@test.com', passwordHash, name: 'Admin', role: 'ADMIN' },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const accessToken = cookieValue(cookies, 'access_token');

    const res = await request(createGuardApp()).get('/api/admin-only').set('Cookie', accessToken);
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
  });
});
