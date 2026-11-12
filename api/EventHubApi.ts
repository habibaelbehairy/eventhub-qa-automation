import { APIRequestContext, expect } from '@playwright/test';

/**
 * Small typed client for the EventHub REST API.
 * UI tests use it only for housekeeping (cleanup) and to read data the UI does not show,
 * never to assert the behaviour under test.
 *
 * Notes from exploring the API:
 * - Every endpoint needs a Bearer token.
 * - DELETE /bookings/{id} hard-deletes the booking and gives the seats back.
 * - Events created by a user have isStatic=false; static demo events belong to the site and are never touched.
 */
export interface ApiEvent {
  id: number;
  title: string;
  eventDate: string;
  isStatic: boolean;
  userId: number | null;
}

export interface ApiBooking {
  id: number;
  bookingRef: string;
  eventId: number;
}

export class EventHubApi {
  constructor(private readonly api: APIRequestContext) {}

  // ---- events --------------------------------------------------------------

  async getEvent(eventId: number): Promise<ApiEvent> {
    const response = await this.api.get(`events/${eventId}`);
    expect(response.status(), `GET events/${eventId}`).toBe(200);
    return (await response.json()).data;
  }

  async listEvents(): Promise<ApiEvent[]> {
    return this.listAll<ApiEvent>('events');
  }

  /** Deletes an event together with the user's bookings on it. 404 = already gone. */
  async deleteEvent(eventId: number): Promise<void> {
    for (const booking of await this.listBookings(`eventId=${eventId}`)) await this.deleteBooking(booking.id);
    const response = await this.api.delete(`events/${eventId}`);
    expect([200, 404], `DELETE events/${eventId}`).toContain(response.status());
  }

  // ---- bookings ------------------------------------------------------------

  async listBookings(filter = ''): Promise<ApiBooking[]> {
    return this.listAll<ApiBooking>(filter ? `bookings?${filter}` : 'bookings');
  }

  /** The booking for a reference shown in the UI, or undefined if it does not exist (any more). */
  async findBookingByRef(bookingRef: string): Promise<ApiBooking | undefined> {
    const response = await this.api.get(`bookings/ref/${encodeURIComponent(bookingRef)}`);
    if (response.status() === 404) return undefined;
    expect(response.status(), `GET bookings/ref/${bookingRef}`).toBe(200);
    return (await response.json()).data;
  }

  /** 404 is accepted: the booking may already be cancelled (for example by the test itself). */
  async deleteBooking(bookingId: number): Promise<void> {
    const response = await this.api.delete(`bookings/${bookingId}`);
    expect([200, 404], `DELETE bookings/${bookingId}`).toContain(response.status());
  }

  async deleteBookingByRef(bookingRef: string): Promise<void> {
    const booking = await this.findBookingByRef(bookingRef);
    if (booking) await this.deleteBooking(booking.id);
  }

  // ---- housekeeping --------------------------------------------------------

  /** Removes ALL bookings and ALL events created by this account (never the site's demo events). */
  async cleanupAccount(): Promise<{ bookings: number; events: number }> {
    const userId = await this.currentUserId();
    const bookings = await this.listBookings();
    for (const booking of bookings) await this.deleteBooking(booking.id);
    const events = (await this.listEvents()).filter((e) => !e.isStatic && e.userId === userId);
    for (const event of events) await this.deleteEvent(event.id);
    return { bookings: bookings.length, events: events.length };
  }

  async currentUserId(): Promise<number> {
    const response = await this.api.get('auth/me');
    expect(response.status(), 'GET auth/me').toBe(200);
    const body = await response.json();
    return (body.user ?? body.data ?? body).id;
  }

  /** Reads every page of a paginated list endpoint (max page size is 100). */
  private async listAll<T>(path: string): Promise<T[]> {
    const separator = path.includes('?') ? '&' : '?';
    const items: T[] = [];
    for (let page = 1; ; page++) {
      const response = await this.api.get(`${path}${separator}limit=100&page=${page}`);
      expect(response.status(), `GET ${path}`).toBe(200);
      const body = await response.json();
      items.push(...body.data);
      if (page >= (body.pagination?.totalPages ?? 1)) return items;
    }
  }
}
