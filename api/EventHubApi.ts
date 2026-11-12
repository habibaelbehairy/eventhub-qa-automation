import { APIRequestContext, expect } from '@playwright/test';
import { BookingsApi } from './BookingsApi';
import { EventsApi } from './EventsApi';

export * from './types';

/**
 * Typed client for the EventHub REST API, composed of one class per resource:
 * `events` (EventsApi) and `bookings` (BookingsApi).
 *
 * The methods below delegate to them, so the specs can keep calling `api.createEvent(...)`,
 * `api.createBooking(...)` and so on; new code may also use `api.events` / `api.bookings` directly.
 * Every endpoint needs a Bearer token, which the fixtures put on the request context.
 */
export class EventHubApi {
  readonly bookings: BookingsApi;
  readonly events: EventsApi;

  constructor(private readonly api: APIRequestContext) {
    this.bookings = new BookingsApi(api);
    this.events = new EventsApi(api, this.bookings, () => this.currentUserId());
  }

  // ---- events (see EventsApi) ----------------------------------------------
  getEvent = (...args: Parameters<EventsApi['getEvent']>) => this.events.getEvent(...args);
  getEventResponse = (...args: Parameters<EventsApi['getEventResponse']>) => this.events.getEventResponse(...args);
  availableSeats = (...args: Parameters<EventsApi['availableSeats']>) => this.events.availableSeats(...args);
  createEvent = (...args: Parameters<EventsApi['createEvent']>) => this.events.createEvent(...args);
  listEvents = () => this.events.listEvents();
  updateEvent = (...args: Parameters<EventsApi['updateEvent']>) => this.events.updateEvent(...args);
  removeEvent = (...args: Parameters<EventsApi['removeEvent']>) => this.events.removeEvent(...args);
  deleteEvent = (...args: Parameters<EventsApi['deleteEvent']>) => this.events.deleteEvent(...args);
  listOwnEvents = () => this.events.listOwnEvents();
  deleteOwnEventsByTitle = (...args: Parameters<EventsApi['deleteOwnEventsByTitle']>) => this.events.deleteOwnEventsByTitle(...args);
  deleteOwnEvents = () => this.events.deleteOwnEvents();

  // ---- bookings (see BookingsApi) ------------------------------------------
  listBookings = (...args: Parameters<BookingsApi['listBookings']>) => this.bookings.listBookings(...args);
  postBooking = (...args: Parameters<BookingsApi['postBooking']>) => this.bookings.postBooking(...args);
  createBooking = (...args: Parameters<BookingsApi['createBooking']>) => this.bookings.createBooking(...args);
  cancelBooking = (...args: Parameters<BookingsApi['cancelBooking']>) => this.bookings.cancelBooking(...args);
  getBookingResponse = (...args: Parameters<BookingsApi['getBookingResponse']>) => this.bookings.getBookingResponse(...args);
  findBookingByRef = (...args: Parameters<BookingsApi['findBookingByRef']>) => this.bookings.findBookingByRef(...args);
  deleteBooking = (...args: Parameters<BookingsApi['deleteBooking']>) => this.bookings.deleteBooking(...args);
  deleteBookingByRef = (...args: Parameters<BookingsApi['deleteBookingByRef']>) => this.bookings.deleteBookingByRef(...args);

  // ---- account -------------------------------------------------------------

  /** GET auth/me answers { user: { userId, email, ... } }. */
  async currentUserId(): Promise<number> {
    const response = await this.api.get('auth/me');
    expect(response.status(), 'GET auth/me').toBe(200);
    const body = await response.json();
    const user = body.user ?? body.data ?? body;
    return user.userId ?? user.id;
  }

  /** Removes ALL bookings and ALL events created by this account (never the site's demo events). */
  async cleanupAccount(): Promise<{ bookings: number; events: number }> {
    const bookings = await this.bookings.listBookings();
    for (const booking of bookings) await this.bookings.deleteBooking(booking.id);
    return { bookings: bookings.length, events: await this.events.deleteOwnEvents() };
  }
}
