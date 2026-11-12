import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

/**
 * Projects:
 *  - ui: browser tests; the auth fixture logs in lazily and caches the session (fixtures/auth.fixture.ts)
 * A future "api" project can be added next to "ui".
 */
export default defineConfig({
  testDir: './tests',
  timeout: env.timeouts.test,
  expect: { timeout: env.timeouts.expect },
  // Shared public environment with shared seat counts: run one test at a time.
  fullyParallel: false,
  workers: 1,
  retries: env.isCI ? 1 : 0,
  forbidOnly: env.isCI,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    ...devices['Desktop Chrome'],
    baseURL: env.baseUrl,
    headless: env.headless,
    launchOptions: { slowMo: env.slowMo },
    viewport: { width: 1366, height: 768 },
    actionTimeout: env.timeouts.action,
    navigationTimeout: env.timeouts.navigation,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'ui', testDir: './tests/ui' }],
});
