import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import 'dotenv/config';

declare const process: {
  env: Record<string, string | undefined>;
};

export const BASE_URL = process.env.BASE_URL ?? 'https://eventhub.rahulshettyacademy.com';

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

/**
 * Launches Chromium, opens a fresh context (clean cookies/localStorage)
 * and navigates to the EventHub website.
 * Watch the flow locally: set HEADLESS=false in .env (and optionally SLOW_MO=500 to
 * pause 500 ms between actions). CI keeps the defaults: headless, no slow motion.
 */
export async function launchBrowser(): Promise<BrowserSession> {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: Number(process.env.SLOW_MO ?? 0),
  });
  const context = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 1366, height: 768 } });
  // Fail fast with a clear error if an element is not found (default is no limit).
  context.setDefaultTimeout(15_000);
  context.setDefaultNavigationTimeout(30_000);
  const page = await context.newPage();
  await page.goto('/');
  return { browser, context, page };
}

/** Closes the context and browser. Safe to call even if launch failed half-way. */
export async function closeBrowser(session?: BrowserSession): Promise<void> {
  await session?.context.close();
  await session?.browser.close();
}
