import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

const DEFAULT_WORKERS = 4;

/**
 * Projects:
 *  - setup:   logs every role in once before the tests (tests/setup/auth.setup.ts)
 *  - ui:      browser tests; the auth fixture reuses the saved session and logs in again if it is rejected
 *  - api:     REST API tests; no browser (fixtures/apiOnly.fixture.ts)
 *  - cleanup: teardown of setup; runs after ui and api and removes stale data (tests/setup/cleanup.teardown.ts)
 */
export default defineConfig({
  testDir: './tests',
  timeout: env.timeouts.test,
  expect: { timeout: env.timeouts.expect },
  // Default: 4 workers. Workers map to accounts in turn (worker 0 = primaryUser, worker 1 = secondaryUser,
  // worker 2 = primaryUser, ...), so with fewer than 4 accounts some workers share an account (and its
  // bookings). Override with WORKERS=2 (one per account) or WORKERS=1 for a serial run.
  // Tests inside a file stay in order.
  fullyParallel: false,
  workers: Number(process.env.WORKERS ?? DEFAULT_WORKERS),
  retries: 1,
  forbidOnly: env.isCI,
  // In CI the github reporter adds failure annotations to the pull request and the run summary.
  reporter: [
    ...(env.isCI ? [['github'] as const] : []),
    ['list'],
    ['html', { open: 'never' }],
  ],

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

  projects: [
    { name: 'setup', testDir: './tests/setup', testMatch: /.*\.setup\.ts/, teardown: 'cleanup' },
    { name: 'cleanup', testDir: './tests/setup', testMatch: /.*\.teardown\.ts/ },
    { name: 'ui', testDir: './tests/ui', dependencies: ['setup'] },
    { name: 'api', testDir: './tests/api', dependencies: ['setup'] },
  ],
});
