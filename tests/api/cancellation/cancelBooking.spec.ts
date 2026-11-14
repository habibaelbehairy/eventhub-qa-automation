import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiBooking } from '../../../utils/testData';
import type { ApiBooking } from '../../../types/api';

/**
 * API — cancel a booking.
 * No event is created: every test lists the seeded events (GET /events, `isStatic`), books 2 tickets for each
 * of them and cancels the booking. Cancelling deletes the booking and gives the seats back.
 * Bookings are tracked so they are removed even if a test fails before cancelling.
 */
test.describe('DELETE /bookings/{id} - cancel a booking', { tag: ['@api', '@booking', '@seeded'] }, () => {
  test('every listed event: a booking can be cancelled once, seats are restored and the booking is gone', async ({ api, bookings }) => {
    // Seeded events only: temporary events from admin tests can be deleted while this loop runs.
    const events = (await api.events.listEvents()).filter((e) => e.isStatic);
    expect(events.length, 'GET /events returns seeded events').toBeGreaterThan(0);

    for (const event of events) {
      await test.step(`event ${event.id}: ${event.title}`, async () => {
        expect(event.availableSeats, 'the event has enough seats').toBeGreaterThanOrEqual(2);
        const seatsBefore = await api.events.availableSeats(event.id);

        const bookingResponse = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 2 }));
        expect(bookingResponse.status).toBe(201);
        const booking = bookingResponse.body.data;
        bookings.track(booking.bookingRef);
        expect(await api.events.availableSeats(event.id)).toBe(seatsBefore - 2);

        // Before cancelling: the booking is found by id, by reference and in the bookings list.
        const byIdResponse = await api.bookings.getBookingResponse(booking.id);
        expect(byIdResponse.status).toBe(200);
        expect(byIdResponse.body.data).toMatchObject({ id: booking.id, bookingRef: booking.bookingRef });

        const byRefResponse = await api.bookings.getBookingByRefResponse(booking.bookingRef);
        expect(byRefResponse.status).toBe(200);
        expect(byRefResponse.body.data).toMatchObject({ id: booking.id, bookingRef: booking.bookingRef });

        const listBeforeResponse = await api.bookings.getBookingsResponse();
        expect(listBeforeResponse.status).toBe(200);
        const listBefore: ApiBooking[] = listBeforeResponse.body.data;
        expect(listBefore.map((b) => b.bookingRef)).toContain(booking.bookingRef);
        expect(listBefore.map((b) => b.id)).toContain(booking.id);

        const response = await api.bookings.cancelBooking(booking.id);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Seats are given back.
        expect(await api.events.availableSeats(event.id)).toBe(seatsBefore);

        // After cancelling: the booking is gone by id, by reference and from the bookings list.
        expect((await api.bookings.getBookingResponse(booking.id)).status).toBe(404);
        expect((await api.bookings.getBookingByRefResponse(booking.bookingRef)).status).toBe(404);

        const listAfterResponse = await api.bookings.getBookingsResponse();
        expect(listAfterResponse.status).toBe(200);
        const listAfter: ApiBooking[] = listAfterResponse.body.data;
        expect(listAfter.map((b) => b.bookingRef)).not.toContain(booking.bookingRef);
        expect(listAfter.map((b) => b.id)).not.toContain(booking.id);

        // A cancelled booking cannot be cancelled again.
        expect((await api.bookings.cancelBooking(booking.id)).status).toBe(404);
      });
    }
  });
});
