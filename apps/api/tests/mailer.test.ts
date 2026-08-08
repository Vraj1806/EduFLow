import { afterEach, describe, expect, it } from 'vitest';
import { resetMailer, sendMail } from '../src/services/mailer.js';

describe('mailer', () => {
  afterEach(() => {
    delete process.env.NOTIFICATIONS_ENABLED;
    delete process.env.SMTP_HOST;
    resetMailer();
  });

  it('throws NOTIFICATIONS_DISABLED when delivery is disabled', async () => {
    delete process.env.NOTIFICATIONS_ENABLED;
    await expect(
      sendMail({ to: 'a@b.com', subject: 'x', text: 'y' }),
    ).rejects.toMatchObject({ statusCode: 503, code: 'NOTIFICATIONS_DISABLED' });
  });

  it('throws SMTP_NOT_CONFIGURED when enabled but no host is set', async () => {
    process.env.NOTIFICATIONS_ENABLED = 'true';
    process.env.SMTP_HOST = '';
    await expect(
      sendMail({ to: 'a@b.com', subject: 'x', text: 'y' }),
    ).rejects.toMatchObject({ statusCode: 503, code: 'SMTP_NOT_CONFIGURED' });
  });
});
