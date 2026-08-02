import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { app, registerFaculty, resetDb } from './helpers.js';

function noticePayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Midterm schedule',
    content: 'Midterms start next Monday.',
    targetClass: 'CS',
    targetDiv: 'A',
    ...overrides,
  };
}

describe('notices', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/notices', () => {
    it('creates a draft notice (unpublished)', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/notices')
        .set('Cookie', session.accessToken)
        .send(noticePayload());

      expect(res.status).toBe(201);
      expect(res.body.data.notice).toMatchObject({
        title: 'Midterm schedule',
        targetClass: 'CS',
        targetDiv: 'A',
        facultyId: session.user.id,
        publishedAt: null,
      });
    });
  });

  describe('GET /api/notices', () => {
    it('lists notices newest first', async () => {
      const session = await registerFaculty();
      await request(app)
        .post('/api/notices')
        .set('Cookie', session.accessToken)
        .send(noticePayload({ title: 'First' }))
        .expect(201);

      const res = await request(app).get('/api/notices').set('Cookie', session.accessToken);
      expect(res.status).toBe(200);
      expect(res.body.data.notices).toHaveLength(1);
      expect(res.body.data.notices[0].title).toBe('First');
    });

    it('returns 404 for a foreign notice', async () => {
      const facultyA = await registerFaculty('a@test.com');
      const facultyB = await registerFaculty('b@test.com');
      const created = await request(app)
        .post('/api/notices')
        .set('Cookie', facultyA.accessToken)
        .send(noticePayload())
        .expect(201);

      const res = await request(app)
        .get(`/api/notices/${created.body.data.notice.id}`)
        .set('Cookie', facultyB.accessToken);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOTICE_NOT_FOUND');
    });
  });

  describe('POST /api/notices/:id/publish', () => {
    it('sets publishedAt and queues a notification', async () => {
      const session = await registerFaculty();
      const created = await request(app)
        .post('/api/notices')
        .set('Cookie', session.accessToken)
        .send(noticePayload())
        .expect(201);

      const res = await request(app)
        .post(`/api/notices/${created.body.data.notice.id}/publish`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.notice.publishedAt).not.toBeNull();

      const notif = await prisma.notification.findFirst({ orderBy: { createdAt: 'desc' } });
      expect(notif).toMatchObject({ type: 'NOTICE', recipient: session.user.id });
      expect(notif!.message).toContain('Midterm schedule');
    });

    it('rejects publishing a notice twice', async () => {
      const session = await registerFaculty();
      const created = await request(app)
        .post('/api/notices')
        .set('Cookie', session.accessToken)
        .send(noticePayload())
        .expect(201);

      await request(app)
        .post(`/api/notices/${created.body.data.notice.id}/publish`)
        .set('Cookie', session.accessToken)
        .expect(200);

      const res = await request(app)
        .post(`/api/notices/${created.body.data.notice.id}/publish`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ALREADY_PUBLISHED');
    });

    it('GET /published returns only published notices', async () => {
      const session = await registerFaculty();
      const created = await request(app)
        .post('/api/notices')
        .set('Cookie', session.accessToken)
        .send(noticePayload())
        .expect(201);
      await request(app)
        .post(`/api/notices/${created.body.data.notice.id}/publish`)
        .set('Cookie', session.accessToken)
        .expect(200);

      const res = await request(app)
        .get('/api/notices/published')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.notices).toHaveLength(1);
    });
  });

  describe('PUT /api/notices/:id', () => {
    it('updates the notice content', async () => {
      const session = await registerFaculty();
      const created = await request(app)
        .post('/api/notices')
        .set('Cookie', session.accessToken)
        .send(noticePayload())
        .expect(201);

      const res = await request(app)
        .put(`/api/notices/${created.body.data.notice.id}`)
        .set('Cookie', session.accessToken)
        .send({ content: 'Updated content.' });

      expect(res.status).toBe(200);
      expect(res.body.data.notice.content).toBe('Updated content.');
    });
  });

  describe('DELETE /api/notices/:id', () => {
    it('deletes the notice', async () => {
      const session = await registerFaculty();
      const created = await request(app)
        .post('/api/notices')
        .set('Cookie', session.accessToken)
        .send(noticePayload())
        .expect(201);

      const res = await request(app)
        .delete(`/api/notices/${created.body.data.notice.id}`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(204);
      expect(await prisma.notice.count()).toBe(0);
    });
  });
});
