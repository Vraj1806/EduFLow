import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for EduFlow browser testing
 * 
 * Tests located in: apps/web/e2e/
 * 
 * Run tests: npx playwright test
 * Run with UI: npx playwright test --ui
 * Run specific test: npx playwright test login
 * Debug: npx playwright test --debug
 * Show report: npx playwright show-report
 */

export default defineConfig({
  testDir: './apps/web/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: false, // Run tests sequentially to avoid DB conflicts
  forbidOnly: !!process.env.CI, // Fail CI if test.only left in code
  retries: process.env.CI ? 2 : 0, // Retry on CI, not locally
  workers: 1, // Single worker to avoid DB lock issues with SQLite
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: '.agent/playwright-report' }],
    ['list'],
    ['json', { outputFile: '.agent/test-results/playwright-results.json' }],
  ],
  
  // Output folders
  outputDir: '.agent/test-results',
  
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:5173',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Trace on retry
    trace: 'on-first-retry',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Slow down actions for debugging (remove in CI)
    // actionTimeout: 0,
    // slowMo: 100,
  },

  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    
    // Mobile testing
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Web server configuration
  webServer: [
    {
      command: 'npm run dev -w apps/api',
      url: 'http://localhost:4000/api/health',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev -w apps/web',
      url: 'http://localhost:5173',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
