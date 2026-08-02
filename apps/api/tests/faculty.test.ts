import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { app, registerFaculty, resetDb } from './helpers.js';

describe('faculty profile', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/faculty/me', () => {
    it('returns the authenticated faculty profile', async () => {
      const session = await registerFaculty();
      const res = await request(app).get('/api/faculty/me').set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.user).toMatchObject({
        id: session.user.id,
        email: 'faculty@test.com',
        name: 'Test Faculty',
        role: 'FACULTY',
      });
    });
  });

  describe('PUT /api/faculty/me', () => {
    it('updates name and normalizes email', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .put('/api/faculty/me')
        .set('Cookie', session.accessToken)
        .send({ name: 'Renamed', email: '  NEW@TEST.com ' });

      expect(res.status).toBe(200);
      expect(res.body.data.user).toMatchObject({ name: 'Renamed', email: 'new@test.com' });
    });

    it('rejects an email already used by another account', async () => {
      const session = await registerFaculty();
      await registerFaculty('taken@test.com');

      const res = await request(app)
        .put('/api/faculty/me')
        .set('Cookie', session.accessToken)
        .send({ email: 'taken@test.com' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });
  });

  describe('PUT /api/faculty/password', () => {
    it('changes the password and the new one works for login', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .put('/api/faculty/password')
        .set('Cookie', session.accessToken)
        .send({ currentPassword: 'password123', newPassword: 'newpassword456' });

      expect(res.status).toBe(204);

      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'faculty@test.com', password: 'newpassword456' });
      expect(login.status).toBe(200);

      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'faculty@test.com', password: 'password123' });
      expect(oldLogin.status).toBe(401);
    });

    it('rejects a wrong current password', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .put('/api/faculty/password')
        .set('Cookie', session.accessToken)
        .send({ currentPassword: 'wrong-password', newPassword: 'newpassword456' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('rejects a short new password', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .put('/api/faculty/password')
        .set('Cookie', session.accessToken)
        .send({ currentPassword: 'password123', newPassword: 'short' });

      expect(res.status).toBe(400);
    });
  });
});
