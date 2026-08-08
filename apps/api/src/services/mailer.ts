import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getConfig } from '../config.js';
import { AppError } from '../middleware/error.js';

/**
 * Mailer Service
 *
 * Thin wrapper around nodemailer. The transport is created lazily from config
 * and cached so hot reloads never open duplicate SMTP connections. When
 * `NOTIFICATIONS_ENABLED=false` every send throws a clear 503 so callers can
 * never mistake an unsent notification for a delivered one.
 */

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transport: Transporter | null = null;

export function getTransport(): Transporter {
  const cfg = getConfig();
  if (cfg.NOTIFICATIONS_ENABLED !== 'true') {
    throw new AppError(
      503,
      'NOTIFICATIONS_DISABLED',
      'Email delivery is not enabled. Set NOTIFICATIONS_ENABLED=true and SMTP_* variables to send notifications.',
    );
  }
  if (!cfg.SMTP_HOST) {
    throw new AppError(503, 'SMTP_NOT_CONFIGURED', 'SMTP_HOST is not configured');
  }

  if (!transport) {
    transport = nodemailer.createTransport({
      host: cfg.SMTP_HOST,
      port: cfg.SMTP_PORT,
      secure: cfg.SMTP_SECURE,
      auth: cfg.SMTP_USER ? { user: cfg.SMTP_USER, pass: cfg.SMTP_PASS } : undefined,
    });
  }
  return transport;
}

export async function sendMail(message: MailMessage): Promise<void> {
  const cfg = getConfig();
  await getTransport().sendMail({
    from: cfg.SMTP_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

/** Drop the cached transport (used by tests and when config changes at runtime). */
export function resetMailer(): void {
  transport = null;
}
