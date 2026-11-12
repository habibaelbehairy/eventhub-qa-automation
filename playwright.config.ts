import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';
import { USER_ROLES } from './auth/users';

/**
 * Projects:
 *  - ui:  browser tests; the auth fixture logs in lazily and caches the session (fixtures/auth.fixture.ts)
 *  - api: REST API tests; no browser, the API client logs its role in once (fixtures/apiOnly.fixture.ts)
 */
export default defineConfig({
  testDir: './tests',
  timeout: env.timeouts.test,
  expect: { timeout: env.timeouts.expect },
  // Each worker runs as its own account (worker 0 = primaryUser, worker 1 = secondaryUser, ...), so
  // workers never share bookings. More workers than accounts would share one, so the default is one
  // worker per account. Override with WORKERS=1 for a fully serial run. Tests inside a file stay in order.
  fullyParallel: false,
  workers: Number(process.env.WORKERS ?? USER_ROLES.length),
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
