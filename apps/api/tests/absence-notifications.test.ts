import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestSession, StudentPayload } from './helpers.js';
import { prisma } from '../src/db.js';
import * as mailer from '../src/services/mailer.js';
import * as notificationService from '../src/services/notification.service.js';
import { app, createStudentViaApi, registerFaculty, resetDb } from './helpers.js';

// Never send real email from tests — the mailer is fully mocked.
vi.mock('../src/services/mailer.js', () => ({
  sendMail: vi.fn(),
  getTransport: vi.fn(),
  resetMailer: vi.fn(),
}));

const sendMailMock = vi.mocked(mailer.sendMail);

const S2 = { studentId: '2025CS002', name: 'Bob Builder', email: 'bob@test.com' };
const S3 = { studentId: '2025CS003', name: 'Cara Contact', email: 'cara@test.com' };

async function seedStudents(faculty: TestSession, overrides: Partial<StudentPayload>[] = []) {
  const specs = overrides.length > 0 ? overrides : [{}];
  const students = await Promise.all(specs.map((o) => createStudentViaApi(faculty, o)));
  type Seeded = Awaited<ReturnType<typeof createStudentViaApi>>;
  return students as [Seeded, ...Seeded[]];
}

async function createSession(faculty: TestSession, classId = 'CS', division = 'A') {
  const res = await request(app)
    .post('/api/attendance/sessions')
    .set('Cookie', faculty.accessToken)
    .send({ classId, division, date: new Date().toISOString() })
    .expect(201);
  return res.body.data.session.id as string;
}

async function processSession(faculty: TestSession, sessionId: string, recognizedStudentIds: string[]) {
  await request(app)
    .post(`/api/attendance/sessions/${sessionId}/process`)
    .set('Cookie', faculty.accessToken)
    .send({ recognizedStudents: recognizedStudentIds.map((studentId) => ({ studentId, confidence: 0.9 })) })
    .expect(200);
}

async function confirmSession(faculty: TestSession, sessionId: string) {
  return request(app)
    .post(`/api/attendance/sessions/${sessionId}/confirm`)
    .set('Cookie', faculty.accessToken)
    .expect(200);
}

describe('absence notifications', () => {
  beforeEach(async () => {
    await resetDb();
    sendMailMock.mockReset();
  });

  afterEach(() => {
    delete process.env.NOTIFICATIONS_ENABLED;
    delete process.env.SMTP_HOST;
    sendMailMock.mockReset();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('confirm attendance', () => {
    it('queues one ABSENCE notification for each absent student', async () => {
      const faculty = await registerFaculty();
      const [s1] = await seedStudents(faculty, []);
      const [s2] = await seedStudents(faculty, [S2]);
      const sessionId = await createSession(faculty);

      await processSession(faculty, sessionId, [s1.id]);
      await confirmSession(faculty, sessionId);

      const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'asc' } });
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        type: 'ABSENCE',
        status: 'PENDING',
        recipient: s2.email,
        title: 'Absence recorded',
      });
      expect(notifications[0]!.message).toContain('Bob Builder');
      expect(notifications[0]!.message).toContain('ABSENT');
      expect(notifications[0]!.message).toContain('CS A');
      expect(notifications[0]!.dedupeKey).toBe(`absence:${sessionId}:${s2.email}`);
      expect(notifications[0]!.senderId).toBe(faculty.user.id);
    });

    it('creates separate notifications for multiple absent students', async () => {
      const faculty = await registerFaculty();
      const [s1] = await seedStudents(faculty);
      const [s2, s3] = await seedStudents(faculty, [S2, S3]);
      const sessionId = await createSession(faculty);

      await processSession(faculty, sessionId, [s1.id]);
      await confirmSession(faculty, sessionId);

      const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'asc' } });
      expect(notifications).toHaveLength(2);
      const recipients = notifications.map((n) => n.recipient).sort();
      expect(recipients).toEqual([s2.email, s3!.email].sort());
      expect(new Set(notifications.map((n) => n.dedupeKey)).size).toBe(2);
    });

    it('does not queue additional notifications when a completed session is confirmed again', async () => {
      const faculty = await registerFaculty();
      const [s1] = await seedStudents(faculty);
      await seedStudents(faculty, [S2]);
      const sessionId = await createSession(faculty);

      await processSession(faculty, sessionId, [s1.id]);
      await confirmSession(faculty, sessionId);
      await request(app)
        .post(`/api/attendance/sessions/${sessionId}/confirm`)
        .set('Cookie', faculty.accessToken)
        .expect(400);

      const count = await prisma.notification.count();
      expect(count).toBe(1);
    });
  });

  describe('manual record update', () => {
    it('queues a notification when a record transitions to ABSENT', async () => {
      const faculty = await registerFaculty();
      const [s1] = await seedStudents(faculty, []);
      const sessionId = await createSession(faculty);

      await request(app)
        .put(`/api/attendance/sessions/${sessionId}/records/${s1.id}`)
        .set('Cookie', faculty.accessToken)
        .send({ status: 'ABSENT' })
        .expect(200);

      const notifications = await prisma.notification.findMany();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        type: 'ABSENCE',
        recipient: s1.email,
        status: 'PENDING',
      });
    });

    it('does not queue a duplicate on repeated ABSENT updates', async () => {
      const faculty = await registerFaculty();
      const [s1] = await seedStudents(faculty, []);
      const sessionId = await createSession(faculty);

      await request(app)
        .put(`/api/attendance/sessions/${sessionId}/records/${s1.id}`)
        .set('Cookie', faculty.accessToken)
        .send({ status: 'ABSENT' })
        .expect(200);
      await request(app)
        .put(`/api/attendance/sessions/${sessionId}/records/${s1.id}`)
        .set('Cookie', faculty.accessToken)
        .send({ status: 'ABSENT' })
        .expect(200);

      expect(await prisma.notification.count()).toBe(1);
    });

    it('does not queue a duplicate when ABSENT is corrected to PRESENT', async () => {
      const faculty = await registerFaculty();
      const [s1] = await seedStudents(faculty, []);
      const sessionId = await createSession(faculty);

      await request(app)
        .put(`/api/attendance/sessions/${sessionId}/records/${s1.id}`)
        .set('Cookie', faculty.accessToken)
        .send({ status: 'ABSENT' })
        .expect(200);
      await request(app)
        .put(`/api/attendance/sessions/${sessionId}/records/${s1.id}`)
        .set('Cookie', faculty.accessToken)
        .send({ status: 'PRESENT' })
        .expect(200);

      const notifications = await prisma.notification.findMany();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]!.status).toBe('PENDING');
    });

    it('does not queue when a record is corrected to EXCUSED', async () => {
      const faculty = await registerFaculty();
      const [s1] = await seedStudents(faculty, []);
      const sessionId = await createSession(faculty);

      await request(app)
        .put(`/api/attendance/sessions/${sessionId}/records/${s1.id}`)
        .set('Cookie', faculty.accessToken)
        .send({ status: 'EXCUSED' })
        .expect(200);

      expect(await prisma.notification.count()).toBe(0);
    });
  });

  describe('delivery via the existing worker queue', () => {
    beforeEach(() => {
      process.env.NOTIFICATIONS_ENABLED = 'true';
      process.env.SMTP_HOST = 'smtp.test';
    });

    it('delivers queued absence notifications to the student email', async () => {
      const faculty = await registerFaculty();
      const [s1] = await seedStudents(faculty, []);
      const [s2] = await seedStudents(faculty, [S2]);
      const sessionId = await createSession(faculty);

      await processSession(faculty, sessionId, [s1.id]);
      await confirmSession(faculty, sessionId);

      const result = await notificationService.deliverPendingNotifications();

      expect(result).toEqual({ skipped: false, attempted: 1, delivered: 1, failed: 0 });
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: s2.email, subject: 'Absence recorded' }),
        expect.objectContaining({ from: expect.stringContaining('eduflow') }),
      );

      const notification = await prisma.notification.findFirstOrThrow();
      expect(notification.status).toBe('SENT');
      expect(notification.sentAt).not.toBeNull();
    });
  });
});