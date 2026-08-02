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

describe('face registration', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/students/:studentId/face', () => {
    it('registers a face profile and marks the student REGISTERED', async () => {
      const session = await registerFaculty();
      const student = await createStudentViaApi(session);

      const res = await request(app)
        .post(`/api/students/${student.id}/face`)
        .set('Cookie', session.accessToken)
        .send({ imageBase64: VALID_IMAGE });

      expect(res.status).toBe(201);
      expect(res.body.data.faceProfile).toMatchObject({
        studentId: student.id,
        modelVersion: 'placeholder-v1.0',
      });

      const stored = await prisma.faceProfile.findUnique({
        where: { studentId: student.id },
      });
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!.embedding)).toHaveLength(128);

      const dbStudent = await prisma.student.findUnique({ where: { id: student.id } });
      expect(dbStudent!.faceStatus).toBe('REGISTERED');
    });

    it('re-registering upserts the profile instead of duplicating', async () => {
      const session = await registerFaculty();
      const student = await createStudentViaApi(session);

      await request(app)
        .post(`/api/students/${student.id}/face`)
        .set('Cookie', session.accessToken)
        .send({ imageBase64: VALID_IMAGE })
        .expect(201);
      await request(app)
        .post(`/api/students/${student.id}/face`)
        .set('Cookie', session.accessToken)
        .send({ imageBase64: VALID_IMAGE })
        .expect(201);

      expect(await prisma.faceProfile.count({ where: { studentId: student.id } })).toBe(1);
    });

    it('rejects an image with an unsupported format', async () => {
      const session = await registerFaculty();
      const student = await createStudentViaApi(session);

      const res = await request(app)
        .post(`/api/students/${student.id}/face`)
        .set('Cookie', session.accessToken)
        .send({ imageBase64: 'data:image/gif;base64,AAAA' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_IMAGE_FORMAT');
    });

    it('rejects registration for a student owned by another faculty member', async () => {
      const facultyA = await registerFaculty('a@test.com');
      const facultyB = await registerFaculty('b@test.com');
      const student = await createStudentViaApi(facultyA);

      const res = await request(app)
        .post(`/api/students/${student.id}/face`)
        .set('Cookie', facultyB.accessToken)
        .send({ imageBase64: VALID_IMAGE });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('STUDENT_NOT_FOUND');
    });
  });

  describe('GET /api/students/:studentId/face/status', () => {
    it('reports NOT_REGISTERED before registration', async () => {
      const session = await registerFaculty();
      const student = await createStudentViaApi(session);

      const res = await request(app)
        .get(`/api/students/${student.id}/face/status`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        studentId: student.id,
        faceStatus: 'NOT_REGISTERED',
        registered: false,
        faceProfile: null,
      });
    });

    it('reports registered=true with profile after registration', async () => {
      const session = await registerFaculty();
      const student = await createStudentViaApi(session);
      await request(app)
        .post(`/api/students/${student.id}/face`)
        .set('Cookie', session.accessToken)
        .send({ imageBase64: VALID_IMAGE })
        .expect(201);

      const res = await request(app)
        .get(`/api/students/${student.id}/face/status`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        faceStatus: 'REGISTERED',
        registered: true,
        faceProfile: { modelVersion: 'placeholder-v1.0' },
      });
    });
  });

  describe('DELETE /api/students/:studentId/face', () => {
    it('removes the face profile and resets status while keeping the student', async () => {
      const session = await registerFaculty();
      const student = await createStudentViaApi(session);
      await request(app)
        .post(`/api/students/${student.id}/face`)
        .set('Cookie', session.accessToken)
        .send({ imageBase64: VALID_IMAGE })
        .expect(201);

      const res = await request(app)
        .delete(`/api/students/${student.id}/face`)
        .set('Cookie', session.accessToken);

      expect(res.status).toBe(204);
      expect(await prisma.faceProfile.count()).toBe(0);
      expect(await prisma.student.count()).toBe(1);
      const dbStudent = await prisma.student.findUnique({ where: { id: student.id } });
      expect(dbStudent!.faceStatus).toBe('NOT_REGISTERED');
    });

    it('returns 404 for a foreign student', async () => {
      const facultyA = await registerFaculty('a@test.com');
      const facultyB = await registerFaculty('b@test.com');
      const student = await createStudentViaApi(facultyA);

      const res = await request(app)
        .delete(`/api/students/${student.id}/face`)
        .set('Cookie', facultyB.accessToken);

      expect(res.status).toBe(404);
    });
  });
});
