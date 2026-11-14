import 'dotenv/config';

/**
 * Single source for environment settings. Values come from .env or CI variables.
 * The rest of the framework imports from here instead of reading process.env directly.
 */
export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://eventhub.rahulshettyacademy.com',
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://api.eventhub.rahulshettyacademy.com/api',
  /** Watch the flow locally with HEADLESS=false (and SLOW_MO=500). CI keeps the defaults. */
  headless: process.env.HEADLESS !== 'false',
  slowMo: Number(process.env.SLOW_MO ?? 0),
  isCI: !!process.env.CI,
  timeouts: {
    /** Max time for one action (click, fill...), so a missing element fails fast with a clear error. */
    action: 15_000,
    navigation: 30_000,
    expect: 10_000,
    test: 120_000,
  },
} as const;
