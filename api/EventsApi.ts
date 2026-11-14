import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { BookingsApi } from './BookingsApi';
import { listAll } from './paginate';
import { ApiEvent, CreateEventInput } from './types';

/**
 * Events endpoints.
 * Events created by a user have isStatic=false; static demo events belong to the site and are never touched.
 */
export class EventsApi {
  constructor(
    private readonly api: APIRequestContext,
    private readonly bookings: BookingsApi,
    private readonly currentUserId: () => Promise<number>,
  ) {}

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
    return listAll<ApiEvent>(this.api, 'events');
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
    for (const booking of await this.bookings.listBookings(`eventId=${eventId}`)) await this.bookings.deleteBooking(booking.id);
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
    await Promise.all(events.map((event) => this.deleteEvent(event.id)));
    return events.length;
  }
}
