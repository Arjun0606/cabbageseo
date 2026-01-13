import { defineConfig, devices } from '@playwright/test';

/**
 * CabbageSEO Playwright Configuration
 * 
 * Run tests: npx playwright test
 * Run specific test: npx playwright test tests/e2e/signup.spec.ts
 * Run with UI: npx playwright test --ui
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially to avoid race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for E2E tests
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  
  use: {
    baseURL: process.env.TEST_BASE_URL || 'https://cabbageseo.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Global setup/teardown
  globalSetup: './tests/seeds/global-setup.ts',
  globalTeardown: './tests/seeds/global-teardown.ts',
});

