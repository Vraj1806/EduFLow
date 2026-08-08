import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // 0 is valid: Node interprets it as "bind an ephemeral port" (used by tests).
  PORT: z.coerce.number().int().min(0).default(4000),
  DATABASE_URL: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(16, 'must be at least 16 characters'),
  REFRESH_TOKEN_SECRET: z.string().min(16, 'must be at least 16 characters'),
  ACCESS_TOKEN_TTL: z.string().default('60m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  AI_ENABLED: z.enum(['true', 'false']).default('false'),
  AI_PROVIDER: z.string().optional(),
  AI_BASE_URL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  ML_ENABLED: z.enum(['true', 'false']).default('false'),
  ML_SERVICE_URL: z.string().default('http://localhost:5000'),
  // Shared secret the ML sidecar requires on every request (defense-in-depth —
  // the sidecar should also be bound to 127.0.0.1 or an internal network).
  ML_SERVICE_SECRET: z.string().default(''),
  // Minimum cosine similarity for a recognized student match.
  ML_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.5),
  // Email delivery for the notification queue. Disabled by default; the worker
  // marks notifications as FAILED when SMTP is unreachable (never fakes SENT).
  NOTIFICATIONS_ENABLED: z.enum(['true', 'false']).default('false'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().min(0).max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('EduFlow <no-reply@eduflow.local>'),
  // Worker drains the queue on this cadence and gives up after this many tries.
  NOTIFICATION_POLL_MS: z.coerce.number().int().min(1000).default(30_000),
  NOTIFICATION_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  // Profile-photo object storage. `none` keeps data-URLs inline (default, no
  // external services); `local` writes to STORAGE_DIR; `s3` uses an S3-compatible
  // bucket (S3_* vars required).
  STORAGE_PROVIDER: z.enum(['none', 'local', 's3']).default('none'),
  STORAGE_DIR: z.string().default('uploads'),
  STORAGE_BASE_URL: z.string().default('/uploads'),
  S3_ENDPOINT: z.string().default(''),
  S3_REGION: z.string().default(''),
  S3_BUCKET: z.string().default(''),
  S3_ACCESS_KEY_ID: z.string().default(''),
  S3_SECRET_ACCESS_KEY: z.string().default(''),
  S3_PUBLIC_URL: z.string().default(''),
  // Extra HTTP request size limits applied beyond Express's default body limit
  // for face/classroom photo uploads.
  MAX_BODY_SIZE: z.string().default('10mb'),
}).superRefine((val, ctx) => {
  if (val.ML_ENABLED === 'true' && !val.ML_SERVICE_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ML_SERVICE_SECRET'],
      message: 'ML_SERVICE_SECRET is required when ML_ENABLED=true',
    });
  }
});

export type Config = z.infer<typeof envSchema>;

/**
 * Validate and return the runtime configuration from process.env.
 * Fails fast with a readable message when required vars are missing.
 */
export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}
