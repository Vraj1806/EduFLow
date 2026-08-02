import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // Vitest 4 defaults the worker to NODE_ENV=production, which makes React
    // load its production build — where `React.act` is stripped. Testing
    // Library needs `act`, so pin the worker to the test environment.
    env: {
      NODE_ENV: 'test',
    },
    // Exclude Playwright e2e tests (run separately with `npx playwright test`)
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/.{idea,git,cache,output,temp}/**'],
  },
});
