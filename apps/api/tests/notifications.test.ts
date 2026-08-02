import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { app, registerFaculty, resetDb } from './helpers.js';

describe('notifications', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/notifications', () => {
    it('creates a PENDING notification', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/notifications')
        .set('Cookie', session.accessToken)
        .send({ type: 'GENERAL', title: 'Hello', message: 'A notification' });

      expect(res.status).toBe(201);
      expect(res.body.data.notification).toMatchObject({
        type: 'GENERAL',
        status: 'PENDING',
        recipient: session.user.id,
      });
    });

    it('rejects an invalid type', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/notifications')
        .set('Cookie', session.accessToken)
        .send({ type: 'SPAM', title: 'X', message: 'Y' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/notifications', () => {
    it('returns notifications with a pending count', async () => {
      const session = await registerFaculty();
      await request(app)
        .post('/api/notifications')
        .set('Cookie', session.accessToken)
        .send({ type: 'GENERAL', title: 'One', message: 'first' })
        .expect(201);
      await request(app)
        .post('/api/notifications')
        .set('Cookie', session.accessToken)
        .send({ type: 'ABSENCE', title: 'Two', message: 'second' })
        .expect(201);

      const res = await request(app)
        .get('/api/notifications')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.pending).toBe(2);
    });
  });

  describe('POST /api/notifications/:id/sent', () => {
    it('marks a notification as SENT', async () => {
      const session = await registerFaculty();
      const created = await request(app)
        .post('/api/notifications')
        .set('Cookie', session.accessToken)
        .send({ type: 'GENERAL', title: 'One', message: 'first' })
        .expect(201);

      const res = await request(app)
        .post(`/api/notifications/${created.body.data.notification.id}/sent`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(204);
      const db = await prisma.notification.findUnique({
        where: { id: created.body.data.notification.id },
      });
      expect(db!.status).toBe('SENT');
      expect(db!.sentAt).not.toBeNull();
    });

    it('does not mark another faculty members notification', async () => {
      const facultyA = await registerFaculty('a@test.com');
      const facultyB = await registerFaculty('b@test.com');
      const created = await request(app)
        .post('/api/notifications')
        .set('Cookie', facultyA.accessToken)
        .send({ type: 'GENERAL', title: 'One', message: 'first' })
        .expect(201);

      await request(app)
        .post(`/api/notifications/${created.body.data.notification.id}/sent`)
        .set('Cookie', facultyB.accessToken)
        .expect(204);

      const db = await prisma.notification.findUnique({
        where: { id: created.body.data.notification.id },
      });
      expect(db!.status).toBe('PENDING');
    });
  });
});
