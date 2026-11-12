import { APIRequestContext, APIResponse, expect } from '@playwright/test';

/**
 * Small typed client for the EventHub REST API.
 * API tests use it to drive and assert the booking flow; UI tests use it only for housekeeping
 * (cleanup) and to read data the UI does not show.
 *
 * Notes from exploring the API:
 * - Every endpoint needs a Bearer token.
 * - POST /bookings decrements seats atomically and returns a Booking with a unique bookingRef.
 * - DELETE /bookings/{id} hard-deletes the booking and gives the seats back.
 * - Events created by a user have isStatic=false; static demo events belong to the site and are never touched.
 */
export type EventCategory = 'Conference' | 'Concert' | 'Sports' | 'Workshop' | 'Festival';

export interface ApiEvent {
  id: number;
  title: string;
  category: string;
  city: string;
  venue: string;
  eventDate: string;
  /** Exact price as stored by the backend, e.g. "49.99" (the UI shows it rounded). */
  price: string;
  totalSeats: number;
  availableSeats: number;
  isStatic: boolean;
  userId: number | null;
}

export interface ApiBooking {
  id: number;
  bookingRef: string;
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  /** Exact total as stored by the backend, e.g. "149.97". */
  totalPrice: string;
  status: 'confirmed' | 'cancelled';
  /** GET /bookings embeds the full event of each booking. */
  event: ApiEvent;
}

/** Body of POST /bookings (see CreateBookingInput in the API docs). */
export interface CreateBookingInput {
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
}

/** Body of POST /events (see CreateEventInput in the API docs). */
export interface CreateEventInput {
  title: string;
  description?: string;
  category: EventCategory;
  venue: string;
  city: string;
  /** ISO 8601 date-time, e.g. "2026-06-15T09:00:00.000Z". */
  eventDate: string;
  price: number;
  totalSeats: number;
  imageUrl?: string;
}

export class EventHubApi {
  constructor(private readonly api: APIRequestContext) {}

  // ---- events --------------------------------------------------------------

  async getEvent(eventId: number): Promise<ApiEvent> {
    const response = await this.api.get(`events/${eventId}`);
    expect(response.status(), `GET events/${eventId}`).toBe(200);
    return (await response.json()).data;
  }

  /** Raw GET /events/{id}, so a test can assert a 404 after the event is deleted. */
  async getEventResponse(eventId: number): Promise<APIResponse> {
    return this.api.get(`events/${eventId}`);
  }

  /** Available seats of an event right now. */
  async availableSeats(eventId: number): Promise<number> {
    return (await this.getEvent(eventId)).availableSeats;
  }

  /** Creates an event and returns it (with its id, availableSeats, ...). */
  async createEvent(input: CreateEventInput): Promise<ApiEvent> {
    const response = await this.api.post('events', { data: input });
    expect(response.status(), 'POST events').toBe(201);
    return (await response.json()).data;
  }

  async listEvents(): Promise<ApiEvent[]> {
    return this.listAll<ApiEvent>('events');
  }

  /** PUT /events/{id} (full update). Asserts the 200 and returns the updated event. */
  async updateEvent(eventId: number, input: CreateEventInput): Promise<ApiEvent> {
    const response = await this.api.put(`events/${eventId}`, { data: input });
    expect(response.status(), `PUT events/${eventId}`).toBe(200);
    return (await response.json()).data;
  }

  /** Raw DELETE /events/{id} that does NOT remove its bookings first, to test the backend cascade. */
  async removeEvent(eventId: number): Promise<APIResponse> {
    return this.api.delete(`events/${eventId}`);
  }

  /** Deletes an event together with the user's bookings on it. 404 = already gone. */
  async deleteEvent(eventId: number): Promise<void> {
    for (const booking of await this.listBookings(`eventId=${eventId}`)) await this.deleteBooking(booking.id);
    const response = await this.api.delete(`events/${eventId}`);
    expect([200, 404], `DELETE events/${eventId}`).toContain(response.status());
  }

  /** Events created by this account (the site's demo events are never included). */
  async listOwnEvents(): Promise<ApiEvent[]> {
    const userId = await this.currentUserId();
    return (await this.listEvents()).filter((e) => !e.isStatic && e.userId === userId);
  }

  /** Deletes this account's events with exactly this title. An event that is already gone is skipped. */
  async deleteOwnEventsByTitle(title: string): Promise<void> {
    for (const event of (await this.listOwnEvents()).filter((e) => e.title === title)) await this.deleteEvent(event.id);
  }

  /** Deletes every event created by this account. Returns how many were deleted. */
  async deleteOwnEvents(): Promise<number> {
    const events = await this.listOwnEvents();
    for (const event of events) await this.deleteEvent(event.id);
    return events.length;
  }

  // ---- bookings ------------------------------------------------------------

  async listBookings(filter = ''): Promise<ApiBooking[]> {
    return this.listAll<ApiBooking>(filter ? `bookings?${filter}` : 'bookings');
  }

  /** Raw POST /bookings, so negative tests can assert the status and error body themselves. */
  async postBooking(input: Partial<CreateBookingInput>): Promise<APIResponse> {
    return this.api.post('bookings', { data: input });
  }

  /** Creates a booking and returns it. Asserts the 201 response. */
  async createBooking(input: CreateBookingInput): Promise<ApiBooking> {
    const response = await this.postBooking(input);
    expect(response.status(), 'POST bookings').toBe(201);
    return (await response.json()).data;
  }

  /** Raw DELETE /bookings/{id}, so the cancel test can assert the 200 and message itself. */
  async cancelBooking(bookingId: number): Promise<APIResponse> {
    return this.api.delete(`bookings/${bookingId}`);
  }

  /** Raw GET /bookings/{id}, so a test can assert a 404 after cancelling. */
  async getBookingResponse(bookingId: number): Promise<APIResponse> {
    return this.api.get(`bookings/${bookingId}`);
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
    const bookings = await this.listBookings();
    for (const booking of bookings) await this.deleteBooking(booking.id);
    return { bookings: bookings.length, events: await this.deleteOwnEvents() };
  }

  /** GET auth/me answers { user: { userId, email, ... } }. */
  async currentUserId(): Promise<number> {
    const response = await this.api.get('auth/me');
    expect(response.status(), 'GET auth/me').toBe(200);
    const body = await response.json();
    const user = body.user ?? body.data ?? body;
    return user.userId ?? user.id;
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
