import { defineConfig } from '@playwright/test';
import 'dotenv/config';

/**
 * The browser is launched by common_steps/launchBrowser.ts inside each test,
 * so browser options (headless, viewport, timeouts) live there, not in `use`.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
});
