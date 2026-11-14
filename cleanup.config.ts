import { defineConfig } from '@playwright/test';
import { env } from './config/env';

/**
 * Separate config for the manual full cleanup (npm run cleanup): removes ALL test data of every account.
 * `npm test` instead runs the age-guarded sweep in scripts/sweepStaleData.ts after the run.
 */
export default defineConfig({
  timeout: env.timeouts.test,
  workers: 1,
  reporter: 'list',
  use: { baseURL: env.baseUrl, headless: true },
  projects: [{ name: 'cleanup', testDir: './scripts', testMatch: /cleanup\.spec\.ts/ }],
});
