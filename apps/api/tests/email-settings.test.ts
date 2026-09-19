import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestSession } from './helpers.js';
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

async function createAbsenceNotification(faculty: TestSession) {
  const student = await createStudentViaApi(faculty, {
    studentId: '2025CS010',
    email: 'stu-email@test.com',
  });
  await prisma.notification.create({
    data: {
      type: 'ABSENCE',
      title: 'Absence recorded',
      message: 'Test absence',
      recipient: student.email,
      senderId: faculty.user.id,
    },
  });
}

describe('email settings (Phase 1: EduFlow central)', () => {
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

  it('defaults a faculty to EDUFLOW with EduFlow available and Gmail reserved', async () => {
    const faculty = await registerFaculty();

    const res = await request(app)
      .get('/api/faculty/email-settings')
      .set('Cookie', faculty.accessToken)
      .expect(200);

    expect(res.body.data.settings.emailPreference).toBe('EDUFLOW');
    expect(res.body.data.settings.senders).toEqual([
      { id: 'EDUFLOW', label: 'Use EduFlow Email', available: true },
      { id: 'GMAIL', label: 'Use Personal Gmail (OAuth)', available: false },
    ]);
  });

  it('lets a faculty opt into "Use EduFlow Email" without touching SMTP credentials', async () => {
    const faculty = await registerFaculty();

    const res = await request(app)
      .put('/api/faculty/email-settings')
      .set('Cookie', faculty.accessToken)
      .send({ emailPreference: 'EDUFLOW' })
      .expect(200);

    expect(res.body.data.settings.emailPreference).toBe('EDUFLOW');
    expect(res.body.data.settings.senders[0]!.available).toBe(true);

    const user = await prisma.user.findUnique({ where: { id: faculty.user.id } });
    expect(user?.emailPreference).toBe('EDUFLOW');
  });

  it('rejects GMAIL with 501 until Phase 2 OAuth is implemented', async () => {
    const faculty = await registerFaculty();

    const res = await request(app)
      .put('/api/faculty/email-settings')
      .set('Cookie', faculty.accessToken)
      .send({ emailPreference: 'GMAIL' })
      .expect(501);

    expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
    const user = await prisma.user.findUnique({ where: { id: faculty.user.id } });
    expect(user?.emailPreference).toBe('EDUFLOW');
  });

  it('requires authentication', async () => {
    await request(app)
      .get('/api/faculty/email-settings')
      .expect(401);
    await request(app)
      .put('/api/faculty/email-settings')
      .send({ emailPreference: 'EDUFLOW' })
      .expect(401);
  });

  it('does not expose SMTP credentials in the settings response', async () => {
    const faculty = await registerFaculty();
    const res = await request(app)
      .get('/api/faculty/email-settings')
      .set('Cookie', faculty.accessToken)
      .expect(200);

    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/SMTP|smtp|password|pass/i);
  });
});

describe('sender resolution in the delivery queue', () => {
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

  it('delivers queued absence notifications from the central EduFlow account', async () => {
    const faculty = await registerFaculty();
    await createAbsenceNotification(faculty);
    process.env.NOTIFICATIONS_ENABLED = 'true';
    process.env.SMTP_HOST = 'smtp.test';

    const result = await notificationService.deliverPendingNotifications();

    expect(result).toEqual({ skipped: false, attempted: 1, delivered: 1, failed: 0 });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'stu-email@test.com' }),
      expect.objectContaining({ from: expect.stringContaining('eduflow') }),
    );
  });

  it('never sends from the central account when a faculty picked an unavailable sender', async () => {
    const faculty = await registerFaculty();
    await createAbsenceNotification(faculty);
    await prisma.user.update({
      where: { id: faculty.user.id },
      data: { emailPreference: 'GMAIL' },
    });
    process.env.NOTIFICATIONS_ENABLED = 'true';
    process.env.SMTP_HOST = 'smtp.test';

    const result = await notificationService.deliverPendingNotifications();

    expect(result).toEqual({ skipped: false, attempted: 1, delivered: 0, failed: 1 });
    expect(sendMailMock).not.toHaveBeenCalled();
    const notification = await prisma.notification.findFirstOrThrow();
    // A single failed attempt stays PENDING (retried); it must never be marked SENT.
    expect(notification.status).toBe('PENDING');
    expect(notification.attempts).toBe(1);
    expect(notification.lastError).toContain('Gmail');
  });
});