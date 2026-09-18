import { getConfig } from '../config.js';
import { prisma } from '../db.js';
import type { PaginationOptions } from '../lib/pagination.js';
import { sendMail } from './mailer.js';

/**
 * Notification Service
 *
 * Records outbound notifications (absence alerts, assignment reminders, notice
 * distribution) with status tracking. Delivery is performed by
 * `deliverPendingNotifications()`, which drains the PENDING queue through the
 * SMTP mailer: each attempt either marks a notification SENT (with `sentAt`)
 * or records a failure and retries up to NOTIFICATION_MAX_ATTEMPTS before
 * marking it FAILED. Notifications are never faked as sent.
 */

export interface CreateNotificationInput {
  type: 'ABSENCE' | 'ASSIGNMENT' | 'NOTICE' | 'GENERAL';
  title: string;
  message: string;
  recipient: string;
  /**
   * Stable key identifying the underlying event (e.g. "sessionId:studentId:ABSENCE").
   * When provided the notification is created idempotently — a second enqueue for
   * the same event returns the existing row and never produces a duplicate. Backed
   * by a unique DB constraint so it holds across processes, not just in memory.
   */
  dedupeKey?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const data = {
    type: input.type,
    title: input.title,
    message: input.message,
    recipient: input.recipient,
    status: 'PENDING' as const,
    ...(input.dedupeKey ? { dedupeKey: input.dedupeKey } : {}),
  };

  if (input.dedupeKey) {
    return prisma.notification.upsert({
      where: { dedupeKey: input.dedupeKey },
      create: data,
      update: {},
    });
  }

  return prisma.notification.create({ data });
}

export async function getNotifications(recipient: string, pagination: PaginationOptions) {
  const where = { recipient };
  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
  ]);
  return { notifications, total };
}

export async function getPendingCount(recipient: string) {
  return prisma.notification.count({
    where: { recipient, status: 'PENDING' },
  });
}

export async function markNotificationSent(id: string, recipient: string) {
  return prisma.notification.updateMany({
    where: { id, recipient },
    data: { status: 'SENT', sentAt: new Date() },
  });
}

/**
 * Resolve the destination address for a queued notification.
 *
 * `recipient` is normally a User id; notifications addressed to an email
 * (e.g. external notices) are sent as-is. Falls back to the user's email.
 */
async function resolveRecipientAddress(recipient: string): Promise<string> {
  if (recipient.includes('@')) return recipient;

  const user = await prisma.user.findUnique({
    where: { id: recipient },
    select: { email: true },
  });
  if (!user) {
    throw new Error(`Cannot deliver: no account found for recipient "${recipient}"`);
  }
  return user.email;
}

export interface DeliveryResult {
  skipped: boolean;
  attempted: number;
  delivered: number;
  failed: number;
}

/**
 * Drain the notification queue: send every PENDING notification (under the
 * retry cap) via SMTP. Idempotent and safe to call repeatedly — the worker and
 * the API can both trigger it. Returns counts for observability.
 */
export async function deliverPendingNotifications(options: { limit?: number } = {}): Promise<DeliveryResult> {
  const cfg = getConfig();
  const result: DeliveryResult = { skipped: true, attempted: 0, delivered: 0, failed: 0 };

  if (cfg.NOTIFICATIONS_ENABLED !== 'true') return result;

  const pending = await prisma.notification.findMany({
    where: {
      status: 'PENDING',
      attempts: { lt: cfg.NOTIFICATION_MAX_ATTEMPTS },
    },
    orderBy: { createdAt: 'asc' },
    take: options.limit ?? 50,
  });

  result.skipped = false;
  result.attempted = pending.length;

  for (const notification of pending) {
    try {
      const to = await resolveRecipientAddress(notification.recipient);
      await sendMail({ to, subject: notification.title, text: notification.message });
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      result.delivered++;
    } catch (err) {
      const attempts = notification.attempts + 1;
      const lastError = err instanceof Error ? err.message : String(err);
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          attempts,
          lastError: lastError.slice(0, 500),
          status: attempts >= cfg.NOTIFICATION_MAX_ATTEMPTS ? 'FAILED' : 'PENDING',
        },
      });
      result.failed++;
    }
  }

  return result;
}
