import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { app, registerFaculty, resetDb } from './helpers.js';

function assignmentPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Lab 1',
    description: 'Implement a linked list',
    classId: 'CS',
    division: 'A',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe('assignments', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/assignments', () => {
    it('creates an assignment and queues a notification', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/assignments')
        .set('Cookie', session.accessToken)
        .send(assignmentPayload());

      expect(res.status).toBe(201);
      expect(res.body.data.assignment).toMatchObject({
        title: 'Lab 1',
        classId: 'CS',
        division: 'A',
        facultyId: session.user.id,
      });

      const notif = await prisma.notification.findFirst({ orderBy: { createdAt: 'desc' } });
      expect(notif).toMatchObject({
        type: 'ASSIGNMENT',
        status: 'PENDING',
        recipient: session.user.id,
      });
      expect(notif!.message).toContain('Lab 1');
    });

    it('rejects a missing title', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/assignments')
        .set('Cookie', session.accessToken)
        .send({ description: 'No title', classId: 'CS', division: 'A', deadline: new Date().toISOString() });
      expect(res.status).toBe(400);
    });

    it('rejects an invalid deadline', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/assignments')
        .set('Cookie', session.accessToken)
        .send(assignmentPayload({ deadline: 'not-a-date' }));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/assignments', () => {
    it('lists assignments ordered by deadline', async () => {
      const session = await registerFaculty();
      await request(app)
        .post('/api/assignments')
        .set('Cookie', session.accessToken)
        .send(assignmentPayload({ title: 'Later' }))
        .expect(201);
      await request(app)
        .post('/api/assignments')
        .set('Cookie', session.accessToken)
        .send(assignmentPayload({
          title: 'Sooner',
          deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        }))
        .expect(201);

      const res = await request(app).get('/api/assignments').set('Cookie', session.accessToken);
      expect(res.status).toBe(200);
      expect(res.body.data.assignments.map((a: { title: string }) => a.title)).toEqual([
        'Sooner',
        'Later',
      ]);
    });

    it('GET /upcoming returns only assignments with future deadlines', async () => {
      const session = await registerFaculty();
      await request(app)
        .post('/api/assignments')
        .set('Cookie', session.accessToken)
        .send(assignmentPayload({ title: 'Future' }))
        .expect(201);
      await request(app)
        .post('/api/assignments')
        .set('Cookie', session.accessToken)
        .send(assignmentPayload({
          title: 'Past',
          deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        }))
        .expect(201);

      const res = await request(app)
        .get('/api/assignments/upcoming')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.assignments.map((a: { title: string }) => a.title)).toEqual(['Future']);
    });

    it('returns 404 for an assignment owned by another faculty member', async () => {
      const facultyA = await registerFaculty('a@test.com');
      const facultyB = await registerFaculty('b@test.com');
      const created = await request(app)
        .post('/api/assignments')
        .set('Cookie', facultyA.accessToken)
        .send(assignmentPayload())
        .expect(201);

      const res = await request(app)
        .get(`/api/assignments/${created.body.data.assignment.id}`)
        .set('Cookie', facultyB.accessToken);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ASSIGNMENT_NOT_FOUND');
    });
  });

  describe('PUT /api/assignments/:id', () => {
    it('updates the assignment', async () => {
      const session = await registerFaculty();
      const created = await request(app)
        .post('/api/assignments')
        .set('Cookie', session.accessToken)
        .send(assignmentPayload())
        .expect(201);

      const res = await request(app)
        .put(`/api/assignments/${created.body.data.assignment.id}`)
        .set('Cookie', session.accessToken)
        .send({ title: 'Lab 1 (Revised)' });

      expect(res.status).toBe(200);
      expect(res.body.data.assignment.title).toBe('Lab 1 (Revised)');
    });
  });

  describe('DELETE /api/assignments/:id', () => {
    it('deletes the assignment', async () => {
      const session = await registerFaculty();
      const created = await request(app)
        .post('/api/assignments')
        .set('Cookie', session.accessToken)
        .send(assignmentPayload())
        .expect(201);

      const res = await request(app)
        .delete(`/api/assignments/${created.body.data.assignment.id}`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(204);
      expect(await prisma.assignment.count()).toBe(0);
    });
  });
});
