import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiBooking } from '../../../utils/testData';

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

        const booking = await api.bookings.createBooking(buildApiBooking(event.id, { quantity: 2 }));
        bookings.track(booking.bookingRef);
        expect(await api.events.availableSeats(event.id)).toBe(seatsBefore - 2);

        const response = await api.bookings.cancelBooking(booking.id);
        expect(response.status(), 'DELETE bookings/{id}').toBe(200);
        expect((await response.json()).success).toBe(true);

        // Seats are given back and the booking is gone from the bookings list.
        expect(await api.events.availableSeats(event.id)).toBe(seatsBefore);
        expect(await api.bookings.findBookingByRef(booking.bookingRef)).toBeUndefined();
        expect((await api.bookings.listBookings()).map((b) => b.bookingRef)).not.toContain(booking.bookingRef);

        // A cancelled booking cannot be fetched or cancelled again.
        expect((await api.bookings.getBookingResponse(booking.id)).status(), 'GET bookings/{id} after cancel').toBe(404);
        expect((await api.bookings.cancelBooking(booking.id)).status(), 'second cancel').toBe(404);
      });
    }
  });
});
