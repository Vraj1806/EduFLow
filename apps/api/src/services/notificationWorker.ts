import { getConfig } from '../config.js';
import { cleanupExpiredRefreshTokens } from './auth.service.js';
import { deliverPendingNotifications } from './notification.service.js';

/**
 * Notification Worker
 *
 * Periodically drains the PENDING notification queue through the mailer and
 * prunes expired refresh-token rows. It only runs when NOTIFICATIONS_ENABLED=true
 * and never keeps the process alive on its own (`timer.unref()`), so tests and
 * one-off scripts exit cleanly.
 */

let timer: NodeJS.Timeout | null = null;

async function tick(): Promise<void> {
  try {
    await deliverPendingNotifications();
  } catch (err) {
    console.error('[api] notification worker tick failed:', err);
  }
  try {
    // Opportunistic garbage collection for revoked/expired session tokens.
    await cleanupExpiredRefreshTokens();
  } catch (err) {
    console.error('[api] refresh-token cleanup failed:', err);
  }
}

/** Begin the background delivery loop (no-op when notifications are disabled). */
export function startNotificationWorker(): void {
  const cfg = getConfig();
  if (cfg.NOTIFICATIONS_ENABLED !== 'true') return;
  if (timer) return;

  void tick(); // drain immediately on boot
  timer = setInterval(() => void tick(), cfg.NOTIFICATION_POLL_MS);
  timer.unref();
}

/** Stop the delivery loop (also called on graceful shutdown). */
export function stopNotificationWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
