import { Page, test, expect } from '@playwright/test';
import { HomePage } from '../page_objects/HomePage';

/**
 * Added to seat-count assertions: EventHub is a shared environment, so another user can book or
 * cancel on the same event while a test runs. CI retries once, so a one-off collision shows as "flaky".
 */
export const CONCURRENCY_HINT =
  'If this happens only occasionally, another user probably booked or cancelled on this shared event at the same moment.';

/**
 * Common step: go to Home and check that each event's card shows the expected number of seats,
 * e.g. after a cancellation, when the seats should be back to the count from before booking.
 */
export async function expectSeatsOnHome(page: Page, events: { title: string; seats: number }[]): Promise<void> {
  await test.step(`Home cards show the expected seats for ${events.length} event(s)`, async () => {
    const homePage = new HomePage(page);
    await homePage.nav.goToHome();
    await homePage.waitForLoaded();
    for (const event of events) {
      const seatsNow = await homePage.eventCard(event.title).seatsValue();
      expect(seatsNow, `Seats on "${event.title}" are ${seatsNow}, expected ${event.seats}. ${CONCURRENCY_HINT}`).toBe(
        event.seats,
      );
    }
  });
}
