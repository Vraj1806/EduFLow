import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { app, createStudentViaApi, registerFaculty, resetDb } from './helpers.js';

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
    .send({ recognizedStudents: [{ studentId: s1.id, confidence: 0.88 }] })
    .expect(200);
  await request(app)
    .post(`/api/attendance/sessions/${sessionId}/confirm`)
    .set('Cookie', session.accessToken)
    .expect(200);

  return { session, s1, s2 };
}

describe('reports', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/reports/attendance', () => {
    it('returns an empty report with a null percentage', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .get('/api/reports/attendance')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.report.summary).toEqual({
        totalStudents: 0,
        totalSessions: 0,
        present: 0,
        absent: 0,
        excused: 0,
        percentage: null,
      });
      expect(res.body.data.report.rows).toEqual([]);
      expect(res.body.data.export).toMatchObject({ available: false, formats: ['PDF', 'CSV'] });
    });

    it('builds a report with per-record rows and totals', async () => {
      const { session } = await seedCompletedSession();
      const res = await request(app)
        .get('/api/reports/attendance?classId=CS&division=A')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      const { report } = res.body.data;
      expect(report.summary).toMatchObject({
        totalSessions: 1,
        totalStudents: 2,
        present: 1,
        absent: 1,
        excused: 0,
        percentage: 50,
      });
      expect(report.rows).toHaveLength(2);
      expect(report.rows[0]).toMatchObject({
        status: expect.stringMatching(/PRESENT|ABSENT|EXCUSED/),
      });
      expect(report.rows[0]).toHaveProperty('name');
      expect(report.rows[0]).toHaveProperty('rollNumber');
      expect(report.rows[0]).toHaveProperty('confidence');
    });

    it('filters to a class that has no sessions', async () => {
      const { session } = await seedCompletedSession();
      const res = await request(app)
        .get('/api/reports/attendance?classId=ME')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.report.rows).toEqual([]);
      expect(res.body.data.report.summary.totalSessions).toBe(0);
    });
  });
});
