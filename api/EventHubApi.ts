import type { APIRequestContext} from '@playwright/test';
import { expect } from '@playwright/test';
import { BookingsApi } from './BookingsApi';
import { EventsApi } from './EventsApi';

export * from './types';

/**
 * Typed client for the EventHub REST API, composed of one class per resource:
 * `events` (EventsApi) and `bookings` (BookingsApi).
 *
 * Specs call the resource clients directly (`api.events.createEvent(...)`, `api.bookings.createBooking(...)`).
 * This class only adds what spans both resources or the account: `currentUserId()` and `cleanupAccount()`.
 * Every endpoint needs a Bearer token, which the fixtures put on the request context.
 */
export class EventHubApi {
  readonly bookings: BookingsApi;
  readonly events: EventsApi;

  constructor(private readonly api: APIRequestContext) {
    this.bookings = new BookingsApi(api);
    this.events = new EventsApi(api, this.bookings, () => this.currentUserId());
  }

  // ---- account -------------------------------------------------------------

  /** GET auth/me answers { user: { userId, email, ... } }. */
  async currentUserId(): Promise<number> {
    const response = await this.api.get('auth/me');
    expect(response.status(), 'GET auth/me').toBe(200);
    const body = await response.json();
    const user = body.user ?? body.data ?? body;
    return user.userId ?? user.id;
  }

  /**
   * Removes the bookings and events created by this account (never the site's demo events).
   * With `olderThanMs` only items created longer ago than that are removed, so a run that is still
   * in progress on the same account is left alone. Default 0 = everything.
   */
  async cleanupAccount(olderThanMs = 0): Promise<{ bookings: number; events: number }> {
    const isOldEnough = (item: { createdAt: string }) => Date.now() - Date.parse(item.createdAt) >= olderThanMs;
    const bookings = (await this.bookings.listBookings()).filter(isOldEnough);
    await Promise.all(bookings.map((booking) => this.bookings.deleteBooking(booking.id)));
    const events = (await this.events.listOwnEvents()).filter(isOldEnough);
    await Promise.all(events.map((event) => this.events.deleteEvent(event.id)));
    return { bookings: bookings.length, events: events.length };
  }
}
