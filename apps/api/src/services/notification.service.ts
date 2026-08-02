import { prisma } from '../db.js';

/**
 * Notification Service
 *
 * Records outbound notifications (absence alerts, assignment reminders, notice
 * distribution) with status tracking. The delivery provider (email / messaging)
 * is intentionally not hardcoded — dispatch will be added behind this service.
 */

export interface CreateNotificationInput {
  type: 'ABSENCE' | 'ASSIGNMENT' | 'NOTICE' | 'GENERAL';
  title: string;
  message: string;
  recipient: string;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      recipient: input.recipient,
      status: 'PENDING',
    },
  });
}

export async function getNotifications(recipient: string) {
  return prisma.notification.findMany({
    where: { recipient },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
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
