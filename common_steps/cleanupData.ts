import { request, APIRequestContext, expect } from '@playwright/test';
import 'dotenv/config';
import { getUser, UserRole } from './login';

/**
 * Cleanup of test data through the REST API.
 * EventHub is a shared public environment, so every test must remove the
 * bookings and events it creates. API calls are used (not the UI) because
 * they are fast and do not depend on the page under test working.
 *
 * Notes from exploring the API:
 * - Every endpoint needs a Bearer token (POST /auth/login).
 * - DELETE /bookings/{id} hard-deletes the booking and restores the seats.
 * - Events created by a user have isStatic=false and userId=<that user>;
 *   static demo events (isStatic=true) belong to the site and are never touched.
 */

export const API_BASE_URL = process.env.API_BASE_URL ?? 'https://api.eventhub.rahulshettyacademy.com/api';

interface ApiSession {
  api: APIRequestContext;
  userId: number;
}

/** Logs in through the API and returns a request context that sends the token on every call. */
export async function createApiSession(role: UserRole = 'primaryUser'): Promise<ApiSession> {
  const user = getUser(role);
  const anonymous = await request.newContext();
  const response = await anonymous.post(`${API_BASE_URL}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  expect(response.status(), `API login for ${role}`).toBe(200);
  const body = await response.json();
  await anonymous.dispose();

  const api = await request.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${body.token}` },
  });
  return { api, userId: body.user.id };
}

/** Deletes one booking. A 404 is accepted (already deleted, e.g. cancelled by the test itself). */
export async function deleteBooking(api: APIRequestContext, bookingId: number): Promise<void> {
  const response = await api.delete(`${API_BASE_URL}/bookings/${bookingId}`);
  expect([200, 404], `delete booking ${bookingId}`).toContain(response.status());
}

/** Deletes a booking using the reference shown on the confirmation screen. */
export async function deleteBookingByRef(api: APIRequestContext, bookingRef: string): Promise<void> {
  const response = await api.get(`${API_BASE_URL}/bookings/ref/${encodeURIComponent(bookingRef)}`);
  if (response.status() === 404) return;
  expect(response.status(), `look up booking ${bookingRef}`).toBe(200);
  const { data } = await response.json();
  await deleteBooking(api, data.id);
}

/** Deletes an event together with any of the user's bookings on it. */
export async function deleteEvent(api: APIRequestContext, eventId: number): Promise<void> {
  for (const booking of await listBookings(api, `eventId=${eventId}`)) {
    await deleteBooking(api, booking.id);
  }
  const response = await api.delete(`${API_BASE_URL}/events/${eventId}`);
  expect([200, 404], `delete event ${eventId}`).toContain(response.status());
}

/**
 * Removes ALL bookings and ALL user-created events of the given test account.
 * Use as a safety net (e.g. in afterAll) so that data from failed or
 * interrupted runs does not pile up in the shared environment.
 */
export async function cleanupTestData(role: UserRole = 'primaryUser'): Promise<{ bookings: number; events: number }> {
  const { api, userId } = await createApiSession(role);
  try {
    const bookings = await listBookings(api);
    for (const booking of bookings) await deleteBooking(api, booking.id);

    const events = (await listEvents(api)).filter((e) => !e.isStatic && e.userId === userId);
    for (const event of events) await deleteEvent(api, event.id);

    return { bookings: bookings.length, events: events.length };
  } finally {
    await api.dispose();
  }
}

// ---- helpers ---------------------------------------------------------------

async function listBookings(api: APIRequestContext, filter = ''): Promise<{ id: number }[]> {
  return listAll(api, `/bookings?${filter}`);
}

async function listEvents(api: APIRequestContext): Promise<{ id: number; isStatic: boolean; userId: number | null }[]> {
  return listAll(api, '/events?');
}

/** Reads every page of a paginated list endpoint (max page size is 100). */
async function listAll(api: APIRequestContext, path: string): Promise<any[]> {
  const items: any[] = [];
  for (let page = 1; ; page++) {
    const response = await api.get(`${API_BASE_URL}${path}&limit=100&page=${page}`);
    expect(response.status(), `GET ${path}`).toBe(200);
    const body = await response.json();
    items.push(...body.data);
    if (page >= (body.pagination?.totalPages ?? 1)) return items;
  }
}
