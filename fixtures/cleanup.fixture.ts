import { test as base } from '@playwright/test';
import { apiTest } from './api.fixture';
import { EventHubApi } from '../api/EventHubApi';
import { newApiContext } from '../api/apiSession';
import type { Role } from '../auth/users';

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

/** Collects the event titles a test creates so the events can be deleted after the test. */
export class EventTracker {
  private readonly titles = new Set<string>();

  /** Remember an event title (titles of test events are unique, see buildEvent). */
  track(title: string): void {
    this.titles.add(title);
  }

  get tracked(): string[] {
    return [...this.titles];
  }
}

export interface CleanupFixtures {
  /**
   * Test-data cleanup handled by the framework. Track every booking the test creates; after the
   * test (passed or failed) each one is deleted through the API. A booking the test already
   * cancelled is simply skipped. The shared environment stays clean without any afterEach in specs.
   */
  bookings: BookingTracker;
  /**
   * Same for events created in the admin area. Deleting an event also deletes the bookings made
   * on it. An event the test already deleted (or the site replaced) is simply skipped.
   */
  events: EventTracker;
}

export const cleanupTest = apiTest.extend<CleanupFixtures>({
  bookings: async ({ role }, use) => {
    const tracker = new BookingTracker();
    await use(tracker);
    await deleteTrackedBookings(role, tracker);
  },

  events: async ({ role }, use) => {
    const tracker = new EventTracker();
    await use(tracker);
    await deleteTrackedEvents(role, tracker);
  },
});

/** Deletes every booking the tracker collected, through the API. Reused by the UI and API fixtures. */
export async function deleteTrackedBookings(role: Role, tracker: BookingTracker): Promise<void> {
  if (tracker.tracked.length === 0 || role === 'anonymous') return;
  await base.step(`Cleanup: delete ${tracker.tracked.length} booking(s) through the API`, async () => {
    const context = await newApiContext(role);
    try {
      const api = new EventHubApi(context);
      await Promise.all(tracker.tracked.map((ref) => api.bookings.deleteBookingByRef(ref)));
    } finally {
      await context.dispose();
    }
  });
}

/** Deletes every event the tracker collected (by title), through the API. Reused by the UI and API fixtures. */
export async function deleteTrackedEvents(role: Role, tracker: EventTracker): Promise<void> {
  if (tracker.tracked.length === 0 || role === 'anonymous') return;
  await base.step(`Cleanup: delete ${tracker.tracked.length} event(s) through the API`, async () => {
    const context = await newApiContext(role);
    try {
      const api = new EventHubApi(context);
      await Promise.all(tracker.tracked.map((title) => api.events.deleteOwnEventsByTitle(title)));
    } finally {
      await context.dispose();
    }
  });
}
