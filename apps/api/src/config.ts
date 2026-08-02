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
