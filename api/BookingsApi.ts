import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { listAll } from './paginate';
import { ApiBooking, CreateBookingInput } from './types';

/**
 * Bookings endpoints.
 * - POST /bookings decrements seats atomically and returns a Booking with a unique bookingRef.
 * - DELETE /bookings/{id} hard-deletes the booking and gives the seats back.
 */
export class BookingsApi {
  constructor(private readonly api: APIRequestContext) {}

  async listBookings(filter = ''): Promise<ApiBooking[]> {
    return listAll<ApiBooking>(this.api, filter ? `bookings?${filter}` : 'bookings');
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

  /** Raw GET /bookings/ref/{ref}, so a test can assert a 403/404 for a booking of another user. */
  async getBookingByRefResponse(bookingRef: string): Promise<APIResponse> {
    return this.api.get(`bookings/ref/${encodeURIComponent(bookingRef)}`);
  }

  /** The booking for a reference shown in the UI, or undefined if it does not exist (any more). */
  async findBookingByRef(bookingRef: string): Promise<ApiBooking | undefined> {
    const response = await this.getBookingByRefResponse(bookingRef);
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
}
