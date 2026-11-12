import { defineConfig } from '@playwright/test';
import { env } from './config/env';

/**
 * Separate config so the cleanup only runs on demand (npm run cleanup), never with npm test.
 * It reuses the same "setup" login as the test run.
 */
export default defineConfig({
  timeout: env.timeouts.test,
  workers: 1,
  reporter: 'list',
  use: { baseURL: env.baseUrl, headless: true },
  projects: [
    { name: 'setup', testDir: './tests', testMatch: /auth\.setup\.ts/ },
    { name: 'cleanup', testDir: './scripts', testMatch: /cleanup\.spec\.ts/, dependencies: ['setup'] },
  ],
});
