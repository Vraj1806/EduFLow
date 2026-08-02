import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import {
  app,
  createStudentViaApi,
  registerFaculty,
  resetDb,
} from './helpers.js';

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function seedCompletedSession() {
  const session = await registerFaculty();
  const s1 = await createStudentViaApi(session, { studentId: '2025CS001' });
  const s2 = await createStudentViaApi(session, {
    studentId: '2025CS002',
    name: 'Bob Builder',
    email: 'bob@test.com',
  });

  const created = await request(app)
    .post('/api/attendance/sessions')
    .set('Cookie', session.accessToken)
    .send({ classId: 'CS', division: 'A', date: new Date().toISOString() })
    .expect(201);
  const sessionId = created.body.data.session.id;

  await request(app)
    .post(`/api/attendance/sessions/${sessionId}/process`)
    .set('Cookie', session.accessToken)
    .send({ recognizedStudents: [{ studentId: s1.id, confidence: 0.9 }] })
    .expect(200);
  await request(app)
    .post(`/api/attendance/sessions/${sessionId}/confirm`)
    .set('Cookie', session.accessToken)
    .expect(200);

  return { session, s1, s2, sessionId };
}

describe('analytics', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/analytics/overview', () => {
    it('returns zeros and null percentage for an empty account', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .get('/api/analytics/overview')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        studentCount: 0,
        sessionCount: 0,
        completedSessionCount: 0,
        todayPresent: 0,
        todayAbsent: 0,
        attendancePercentage: null,
        upcomingAssignments: 0,
        publishedNotices: 0,
        pendingNotifications: 0,
      });
    });

    it('aggregates counts across the faculty account', async () => {
      const { session } = await seedCompletedSession();
      await request(app)
        .post('/api/assignments')
        .set('Cookie', session.accessToken)
        .send({
          title: 'Lab 1',
          description: 'x',
          classId: 'CS',
          division: 'A',
          deadline: new Date(Date.now() + 86400000).toISOString(),
        })
        .expect(201);
      const notice = await request(app)
        .post('/api/notices')
        .set('Cookie', session.accessToken)
        .send({ title: 'Notice', content: 'Body' })
        .expect(201);
      await request(app)
        .post(`/api/notices/${notice.body.data.notice.id}/publish`)
        .set('Cookie', session.accessToken)
        .expect(200);

      const res = await request(app)
        .get('/api/analytics/overview')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        studentCount: 2,
        sessionCount: 1,
        completedSessionCount: 1,
        todayPresent: 1,
        todayAbsent: 1,
        attendancePercentage: 50,
        upcomingAssignments: 1,
        publishedNotices: 1,
        pendingNotifications: 2, // 1 assignment + 1 notice notification
      });
    });
  });

  describe('GET /api/analytics/trend', () => {
    it('returns a zero-filled series when there are no completed sessions', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .get('/api/analytics/trend?days=7')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.trend).toHaveLength(7);
      for (const day of res.body.data.trend) {
        expect(day).toMatchObject({ present: 0, absent: 0, total: 0 });
      }
    });

    it('clamps days to the allowed range', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .get('/api/analytics/trend?days=500')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.trend).toHaveLength(60);
    });

    it('reports present/absent totals for completed sessions', async () => {
      const { session } = await seedCompletedSession();
      const res = await request(app)
        .get('/api/analytics/trend?days=14')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      const todayKey = toLocalDateKey(new Date());
      const today = res.body.data.trend.find(
        (d: { date: string }) => d.date === todayKey
      );
      expect(today).toMatchObject({ present: 1, absent: 1, total: 2 });
    });
  });

  describe('GET /api/analytics/classes', () => {
    it('returns empty when there are no completed sessions', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .get('/api/analytics/classes')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.classes).toEqual([]);
    });

    it('groups stats per class and division', async () => {
      const { session } = await seedCompletedSession();
      const res = await request(app)
        .get('/api/analytics/classes')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.classes).toEqual([
        { class: 'CS', division: 'A', sessions: 1, present: 1, absent: 1, percentage: 50 },
      ]);
    });
  });
});
