import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

const DEFAULT_WORKERS = 4;

/**
 * Projects:
 *  - ui:  browser tests; the auth fixture logs in lazily and caches the session (fixtures/auth.fixture.ts)
 *  - api: REST API tests; no browser, the API client logs its role in once (fixtures/apiOnly.fixture.ts)
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

  projects: [
    { name: 'ui', testDir: './tests/ui' },
    { name: 'api', testDir: './tests/api' },
  ],
});
