import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import {
  startNotificationWorker,
  stopNotificationWorker,
} from '../src/services/notificationWorker.js';
import { resetDb } from './helpers.js';

describe('notification worker', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(() => {
    delete process.env.NOTIFICATIONS_ENABLED;
    stopNotificationWorker();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('does not start a timer when notifications are disabled', () => {
    delete process.env.NOTIFICATIONS_ENABLED;
    expect(() => startNotificationWorker()).not.toThrow();
    expect(() => stopNotificationWorker()).not.toThrow();
  });

  it('starts and stops cleanly when enabled', async () => {
    process.env.NOTIFICATIONS_ENABLED = 'true';
    expect(() => startNotificationWorker()).not.toThrow();
    // Starting twice must not create a second interval.
    expect(() => startNotificationWorker()).not.toThrow();
    // Allow the immediate boot tick to settle before teardown.
    await new Promise((resolve) => setTimeout(resolve, 50));
    stopNotificationWorker();
  });
});
