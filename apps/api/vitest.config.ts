import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/global-setup.ts',
    // SQLite is a single file — run test files serially to avoid lock contention.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
      ACCESS_TOKEN_SECRET: 'test-access-secret-0123456789abcdef',
      REFRESH_TOKEN_SECRET: 'test-refresh-secret-0123456789abcdef',
      ACCESS_TOKEN_TTL: '60m',
      REFRESH_TOKEN_TTL: '7d',
      COOKIE_SECURE: 'false',
      PORT: '0',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/loadEnv.ts'],
      reporter: ['text', 'html'],
      thresholds: {
        statements: 80,
        functions: 80,
        branches: 60,
        lines: 80,
      },
    },
  },
});
