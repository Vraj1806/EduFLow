import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import {
  VALID_IMAGE,
  app,
  createStudentViaApi,
  registerFaculty,
  resetDb,
} from './helpers.js';

async function seedClass(session: Awaited<ReturnType<typeof registerFaculty>>) {
  const s1 = await createStudentViaApi(session, { studentId: '2025CS001' });
  const s2 = await createStudentViaApi(session, {
    studentId: '2025CS002',
    name: 'Bob Builder',
    email: 'bob@test.com',
  });
  return { s1, s2 };
}

function sessionPayload(classId = 'CS', division = 'A') {
  return { classId, division, date: new Date().toISOString() };
}

describe('attendance', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/attendance/sessions', () => {
    it('creates a session in DRAFT status', async () => {
      const session = await registerFaculty();

      const res = await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', session.accessToken)
        .send(sessionPayload());

      expect(res.status).toBe(201);
      expect(res.body.data.session).toMatchObject({
        classId: 'CS',
        division: 'A',
        status: 'DRAFT',
        facultyId: session.user.id,
      });
    });

    it('rejects an invalid date with 400', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', session.accessToken)
        .send({ classId: 'CS', division: 'A', date: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/attendance/sessions', () => {
    it('lists sessions with nested records', async () => {
      const session = await registerFaculty();
      await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', session.accessToken)
        .send(sessionPayload())
        .expect(201);

      const res = await request(app)
        .get('/api/attendance/sessions')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.sessions).toHaveLength(1);
      expect(res.body.data.sessions[0].records).toEqual([]);
    });

    it('returns 404 when fetching a foreign session', async () => {
      const facultyA = await registerFaculty('a@test.com');
      const facultyB = await registerFaculty('b@test.com');
      const created = await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', facultyA.accessToken)
        .send(sessionPayload())
        .expect(201);

      const res = await request(app)
        .get(`/api/attendance/sessions/${created.body.data.session.id}`)
        .set('Cookie', facultyB.accessToken);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('SESSION_NOT_FOUND');
    });
  });

  describe('POST /api/attendance/sessions/:id/process', () => {
    it('marks recognized students PRESENT and moves session to PROCESSING', async () => {
      const session = await registerFaculty();
      const { s1 } = await seedClass(session);
      const created = await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', session.accessToken)
        .send(sessionPayload())
        .expect(201);
      const sessionId = created.body.data.session.id;

      const res = await request(app)
        .post(`/api/attendance/sessions/${sessionId}/process`)
        .set('Cookie', session.accessToken)
        .send({ recognizedStudents: [{ studentId: s1.id, confidence: 0.92 }] });

      expect(res.status).toBe(200);
      expect(res.body.data.session.status).toBe('PROCESSING');
      expect(res.body.data.session.records).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ studentId: s1.id, status: 'PRESENT', confidence: 0.92 }),
        ])
      );
    });

    it('rejects processing a session that is not DRAFT', async () => {
      const session = await registerFaculty();
      const { s1 } = await seedClass(session);
      const created = await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', session.accessToken)
        .send(sessionPayload())
        .expect(201);
      const sessionId = created.body.data.session.id;

      await request(app)
        .post(`/api/attendance/sessions/${sessionId}/process`)
        .set('Cookie', session.accessToken)
        .send({ recognizedStudents: [{ studentId: s1.id, confidence: 0.9 }] })
        .expect(200);

      const res = await request(app)
        .post(`/api/attendance/sessions/${sessionId}/process`)
        .set('Cookie', session.accessToken)
        .send({ recognizedStudents: [{ studentId: s1.id, confidence: 0.9 }] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SESSION_NOT_EDITABLE');
    });
  });

  describe('POST /api/attendance/sessions/:id/confirm', () => {
    it('marks unmarked students ABSENT and completes the session', async () => {
      const session = await registerFaculty();
      const { s1, s2 } = await seedClass(session);
      const created = await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', session.accessToken)
        .send(sessionPayload())
        .expect(201);
      const sessionId = created.body.data.session.id;

      await request(app)
        .post(`/api/attendance/sessions/${sessionId}/process`)
        .set('Cookie', session.accessToken)
        .send({ recognizedStudents: [{ studentId: s1.id, confidence: 0.9 }] })
        .expect(200);

      const res = await request(app)
        .post(`/api/attendance/sessions/${sessionId}/confirm`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.session.status).toBe('COMPLETED');
      const records = res.body.data.session.records as Array<{
        studentId: string;
        status: string;
      }>;
      expect(records.find((r) => r.studentId === s1.id)!.status).toBe('PRESENT');
      expect(records.find((r) => r.studentId === s2.id)!.status).toBe('ABSENT');
    });

    it('rejects confirming an already completed session', async () => {
      const session = await registerFaculty();
      const { s1 } = await seedClass(session);
      const created = await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', session.accessToken)
        .send(sessionPayload())
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

      const res = await request(app)
        .post(`/api/attendance/sessions/${sessionId}/confirm`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ALREADY_COMPLETED');
    });
  });

  describe('PUT /api/attendance/sessions/:sessionId/records/:studentId', () => {
    it('upserts a manual record status', async () => {
      const session = await registerFaculty();
      const { s1 } = await seedClass(session);
      const created = await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', session.accessToken)
        .send(sessionPayload())
        .expect(201);
      const sessionId = created.body.data.session.id;

      const res = await request(app)
        .put(`/api/attendance/sessions/${sessionId}/records/${s1.id}`)
        .set('Cookie', session.accessToken)
        .send({ status: 'EXCUSED' });

      expect(res.status).toBe(200);
      expect(res.body.data.record).toMatchObject({ sessionId, studentId: s1.id, status: 'EXCUSED' });
    });
  });

  describe('GET /api/attendance/student/:studentId', () => {
    it('returns attendance history for a student', async () => {
      const session = await registerFaculty();
      const { s1, s2 } = await seedClass(session);
      const created = await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', session.accessToken)
        .send(sessionPayload())
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

      const res = await request(app)
        .get(`/api/attendance/student/${s2.id}`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.attendance).toHaveLength(1);
      expect(res.body.data.attendance[0]).toMatchObject({ status: 'ABSENT' });
    });
  });

  describe('GET /api/attendance/stats', () => {
    it('computes per-student percentages over the matching sessions', async () => {
      const session = await registerFaculty();
      const { s1, s2 } = await seedClass(session);
      const created = await request(app)
        .post('/api/attendance/sessions')
        .set('Cookie', session.accessToken)
        .send(sessionPayload())
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

      const res = await request(app)
        .get('/api/attendance/stats?classId=CS&division=A')
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.totalSessions).toBe(1);
      const byId = Object.fromEntries(
        res.body.data.students.map((s: { studentId: string; present: number }) => [
          s.studentId,
          s,
        ])
      );
      expect(byId[s1.id].present).toBe(1);
      expect(byId[s1.id].percentage).toBe(100);
      expect(byId[s2.id].present).toBe(0);
      expect(byId[s2.id].absent).toBe(1);
    });
  });

  describe('POST /api/attendance/recognize', () => {
    it('detects faces and returns a recognition result', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/attendance/recognize')
        .set('Cookie', session.accessToken)
        .send({
          imageBase64: 'data:image/png;base64,iVBORw0KGgo=',
          classId: 'CS',
          division: 'A',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.totalFaces).toBeGreaterThan(0);
      expect(res.body.data).toHaveProperty('recognizedStudents');
      expect(res.body.data).toHaveProperty('unknownFaces');
    });

    it('rejects an invalid image format', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/attendance/recognize')
        .set('Cookie', session.accessToken)
        .send({ imageBase64: 'not-base64', classId: 'CS', division: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_IMAGE_FORMAT');
    });

    it('recognizes registered students and reports unknown faces', async () => {
      const session = await registerFaculty();
      const { s1, s2 } = await seedClass(session);
      await request(app)
        .post(`/api/students/${s1.id}/face`)
        .set('Cookie', session.accessToken)
        .send({ imageBase64: VALID_IMAGE })
        .expect(201);
      await request(app)
        .post(`/api/students/${s2.id}/face`)
        .set('Cookie', session.accessToken)
        .send({ imageBase64: VALID_IMAGE })
        .expect(201);

      const res = await request(app)
        .post('/api/attendance/recognize')
        .set('Cookie', session.accessToken)
        .send({ imageBase64: VALID_IMAGE, classId: 'CS', division: 'A' });

      expect(res.status).toBe(200);
      expect(res.body.data.totalFaces).toBeGreaterThan(0);
      // Faces that duplicate an already-recognized student are de-duplicated, so
      // recognized + unknown may be less than the raw face count.
      expect(res.body.data.recognizedStudents.length + res.body.data.unknownFaces.length).toBeLessThanOrEqual(
        res.body.data.totalFaces
      );
      for (const r of res.body.data.recognizedStudents) {
        expect(r).toMatchObject({
          studentName: expect.any(String),
          rollNumber: expect.any(String),
          confidence: expect.any(Number),
          faceIndex: expect.any(Number),
        });
      }
    });
  });
});
