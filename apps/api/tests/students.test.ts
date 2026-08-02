import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import {
  app,
  createStudentViaApi,
  registerFaculty,
  resetDb,
  studentPayload,
} from './helpers.js';

describe('students', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/students', () => {
    it('creates a student with NOT_REGISTERED face status', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/students')
        .set('Cookie', session.accessToken)
        .send(studentPayload());

      expect(res.status).toBe(201);
      expect(res.body.data.student).toMatchObject({
        studentId: '2025CS001',
        name: 'Alice Wonder',
        class: 'CS',
        division: 'A',
        faceStatus: 'NOT_REGISTERED',
        facultyId: session.user.id,
      });
    });

    it('rejects a duplicate studentId with 409', async () => {
      const session = await registerFaculty();
      await createStudentViaApi(session);

      const res = await request(app)
        .post('/api/students')
        .set('Cookie', session.accessToken)
        .send(studentPayload({ email: 'other@test.com' }));

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('STUDENT_ID_TAKEN');
    });

    it('rejects a duplicate email with 409', async () => {
      const session = await registerFaculty();
      await createStudentViaApi(session);

      const res = await request(app)
        .post('/api/students')
        .set('Cookie', session.accessToken)
        .send(studentPayload({ studentId: '2025CS002' }));

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('rejects an invalid email with 400', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/students')
        .set('Cookie', session.accessToken)
        .send(studentPayload({ email: 'not-an-email' }));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('requires authentication', async () => {
      const res = await request(app).post('/api/students').send(studentPayload());
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/students', () => {
    it('lists only the calling faculty members students', async () => {
      const facultyA = await registerFaculty('a@test.com');
      const facultyB = await registerFaculty('b@test.com');

      await createStudentViaApi(facultyA);
      await createStudentViaApi(facultyB, { studentId: '2025CS002', email: 'bob@test.com' });

      const res = await request(app)
        .get('/api/students')
        .set('Cookie', facultyA.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.students).toHaveLength(1);
      expect(res.body.data.students[0]).toMatchObject({ studentId: '2025CS001' });
    });

    it('searches by name, studentId, and rollNumber with ?q=', async () => {
      const session = await registerFaculty();
      await createStudentViaApi(session);
      await createStudentViaApi(session, {
        studentId: '2025CS002',
        rollNumber: '02',
        name: 'Bob Builder',
        email: 'bob@test.com',
      });

      for (const query of ['alice', '2025CS002', 'Builder']) {
        const res = await request(app)
          .get(`/api/students?q=${query}`)
          .set('Cookie', session.accessToken);
        expect(res.status).toBe(200);
        expect(res.body.data.students).toHaveLength(1);
      }
    });
  });

  describe('GET /api/students/:id', () => {
    it('returns the student with face profile include', async () => {
      const session = await registerFaculty();
      const student = await createStudentViaApi(session);

      const res = await request(app)
        .get(`/api/students/${student.id}`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data.student).toMatchObject({ id: student.id });
      expect(res.body.data.student).toHaveProperty('faceProfile', null);
    });

    it('returns 404 for a student owned by another faculty member', async () => {
      const facultyA = await registerFaculty('a@test.com');
      const facultyB = await registerFaculty('b@test.com');
      const student = await createStudentViaApi(facultyA);

      const res = await request(app)
        .get(`/api/students/${student.id}`)
        .set('Cookie', facultyB.accessToken);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('STUDENT_NOT_FOUND');
    });
  });

  describe('PUT /api/students/:id', () => {
    it('updates editable fields', async () => {
      const session = await registerFaculty();
      const student = await createStudentViaApi(session);

      const res = await request(app)
        .put(`/api/students/${student.id}`)
        .set('Cookie', session.accessToken)
        .send({ name: 'Alice Revised', rollNumber: '99' });

      expect(res.status).toBe(200);
      expect(res.body.data.student).toMatchObject({
        id: student.id,
        name: 'Alice Revised',
        rollNumber: '99',
      });
    });

    it('rejects an email already used by another student', async () => {
      const session = await registerFaculty();
      const first = await createStudentViaApi(session);
      await createStudentViaApi(session, { studentId: '2025CS002', email: 'bob@test.com' });

      const res = await request(app)
        .put(`/api/students/${first.id}`)
        .set('Cookie', session.accessToken)
        .send({ email: 'bob@test.com' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('returns 404 when updating a foreign student', async () => {
      const facultyA = await registerFaculty('a@test.com');
      const facultyB = await registerFaculty('b@test.com');
      const student = await createStudentViaApi(facultyA);

      const res = await request(app)
        .put(`/api/students/${student.id}`)
        .set('Cookie', facultyB.accessToken)
        .send({ name: 'Hijack' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('deletes the student and cascades the face profile', async () => {
      const session = await registerFaculty();
      const student = await createStudentViaApi(session);
      await prisma.faceProfile.create({
        data: { studentId: student.id, embedding: '[]', modelVersion: 'test' },
      });

      const res = await request(app)
        .delete(`/api/students/${student.id}`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(204);
      expect(await prisma.student.count()).toBe(0);
      expect(await prisma.faceProfile.count()).toBe(0);
    });
  });
});
