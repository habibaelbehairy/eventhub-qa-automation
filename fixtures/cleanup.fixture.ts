import { test as base } from '@playwright/test';
import { apiTest } from './api.fixture';
import { EventHubApi } from '../api/EventHubApi';
import { newApiContext } from '../api/apiSession';

/** Collects the bookings a test makes so they can be deleted after the test. */
export class BookingTracker {
  private readonly refs = new Set<string>();

  /** Remember a booking reference (e.g. pass `onBooked: (ref) => bookings.track(ref)` to bookTickets). */
  track(bookingRef: string): void {
    this.refs.add(bookingRef);
  }

  get tracked(): string[] {
    return [...this.refs];
  }
}

export interface CleanupFixtures {
  /**
   * Test-data cleanup handled by the framework. Track every booking the test creates; after the
   * test (passed or failed) each one is deleted through the API. A booking the test already
   * cancelled is simply skipped. The shared environment stays clean without any afterEach in specs.
   */
  bookings: BookingTracker;
}

export const cleanupTest = apiTest.extend<CleanupFixtures>({
  bookings: async ({ role }, use) => {
    const tracker = new BookingTracker();
    await use(tracker);

    if (tracker.tracked.length === 0 || role === 'anonymous') return;
    await base.step(`Cleanup: delete ${tracker.tracked.length} booking(s) through the API`, async () => {
      const context = await newApiContext(role);
      try {
        const api = new EventHubApi(context);
        for (const ref of tracker.tracked) await api.deleteBookingByRef(ref);
      } finally {
        await context.dispose();
      }
    });
  },
});
