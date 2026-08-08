import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/db.js';
import * as mailer from '../src/services/mailer.js';
import * as notificationService from '../src/services/notification.service.js';
import { app, registerFaculty, resetDb } from './helpers.js';

// Never send real email from tests — the mailer is fully mocked.
vi.mock('../src/services/mailer.js', () => ({
  sendMail: vi.fn(),
  getTransport: vi.fn(),
  resetMailer: vi.fn(),
}));

const sendMailMock = vi.mocked(mailer.sendMail);

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

  describe('deliverPendingNotifications (SMTP)', () => {
    beforeEach(async () => {
      await resetDb();
      sendMailMock.mockReset();
      process.env.NOTIFICATIONS_ENABLED = 'true';
      process.env.SMTP_HOST = 'smtp.test';
      process.env.NOTIFICATION_MAX_ATTEMPTS = '2';
    });

    afterEach(() => {
      delete process.env.NOTIFICATIONS_ENABLED;
      delete process.env.SMTP_HOST;
      delete process.env.NOTIFICATION_MAX_ATTEMPTS;
    });

    it('delivers pending notifications to the recipient account email and marks SENT', async () => {
      const session = await registerFaculty();
      await prisma.notification.createMany({
        data: [
          { type: 'GENERAL', title: 'One', message: 'first', recipient: session.user.id },
          { type: 'ABSENCE', title: 'Two', message: 'second', recipient: session.user.id },
        ],
      });

      const result = await notificationService.deliverPendingNotifications();

      expect(result).toEqual({ skipped: false, attempted: 2, delivered: 2, failed: 0 });
      expect(sendMailMock).toHaveBeenCalledTimes(2);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'faculty@test.com', subject: 'One', text: 'first' }),
      );

      const all = await prisma.notification.findMany();
      expect(all).toHaveLength(2);
      expect(all.every((n) => n.status === 'SENT')).toBe(true);
      expect(all.every((n) => n.sentAt !== null)).toBe(true);
    });

    it('sends directly when the recipient is already an email address', async () => {
      await prisma.notification.create({
        data: { type: 'NOTICE', title: 'Notice', message: 'hi', recipient: 'parent@example.com' },
      });

      await notificationService.deliverPendingNotifications();

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'parent@example.com' }),
      );
    });

    it('retries on failure and marks FAILED after the attempt cap', async () => {
      sendMailMock.mockRejectedValue(new Error('smtp down'));
      const session = await registerFaculty();
      await prisma.notification.create({
        data: { type: 'GENERAL', title: 'F', message: 'boom', recipient: session.user.id },
      });

      await notificationService.deliverPendingNotifications();
      let db = await prisma.notification.findFirstOrThrow();
      expect(db.attempts).toBe(1);
      expect(db.status).toBe('PENDING');
      expect(db.lastError).toBe('smtp down');

      await notificationService.deliverPendingNotifications();
      db = await prisma.notification.findFirstOrThrow();
      expect(db.attempts).toBe(2);
      expect(db.status).toBe('FAILED');
      expect(db.sentAt).toBeNull();

      // The FAILED notification is not retried any further.
      sendMailMock.mockReset();
      await notificationService.deliverPendingNotifications();
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it('does nothing when notifications are disabled', async () => {
      delete process.env.NOTIFICATIONS_ENABLED;
      const session = await registerFaculty();
      await prisma.notification.create({
        data: { type: 'GENERAL', title: 'One', message: 'first', recipient: session.user.id },
      });

      const result = await notificationService.deliverPendingNotifications();

      expect(result).toEqual({ skipped: true, attempted: 0, delivered: 0, failed: 0 });
      expect(sendMailMock).not.toHaveBeenCalled();
      const db = await prisma.notification.findFirstOrThrow();
      expect(db.status).toBe('PENDING');
    });
  });
});
