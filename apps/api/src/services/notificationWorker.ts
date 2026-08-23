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
 *
 * WHERE THIS RUNS:
 *   - local dev:  started by src/index.ts alongside the Express listener.
 *   - production: NOT in Vercel serverless functions — setInterval timers do
 *     not survive between invocations, so the queue would never drain
 *     reliably. Run this worker as a long-lived process instead (any small
 *     always-on host: Railway/Render/Fly worker, or a VPS systemd service)
 *     by executing: `node -e "require('./dist/services/notificationWorker.js').startNotificationWorker()"`
 *     with the same environment variables as the API (it only needs
 *     DATABASE_URL + SMTP_* + NOTIFICATIONS_ENABLED=true).
 *     Alternative: keep it disabled on serverless and drain the queue via an
 *     authenticated cron trigger that calls notification.service directly.
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
