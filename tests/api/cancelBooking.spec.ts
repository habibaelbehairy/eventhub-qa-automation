import { test, expect } from '../../fixtures/apiOnly.fixture';
import { buildApiBooking } from '../../utils/testData';

/**
 * API — cancel a booking.
 * No event is created: every test lists the existing events (GET /events), books 2 tickets for each
 * of them and cancels the booking. Cancelling deletes the booking and gives the seats back.
 * Bookings are tracked so they are removed even if a test fails before cancelling.
 */
test.describe('DELETE /bookings/{id} — cancel a booking', { tag: ['@api', '@booking'] }, () => {
  test('cancelling a booking removes it and restores the seats for every listed event', async ({ api, bookings }) => {
    const events = await api.listEvents();
    expect(events.length, 'GET /events returns events').toBeGreaterThan(0);

    for (const event of events) {
      await test.step(`event ${event.id}: ${event.title}`, async () => {
        expect(event.availableSeats, 'the event has enough seats').toBeGreaterThanOrEqual(2);
        const seatsBefore = await api.availableSeats(event.id);

        const booking = await api.createBooking(buildApiBooking(event.id, { quantity: 2 }));
        bookings.track(booking.bookingRef);
        expect(await api.availableSeats(event.id)).toBe(seatsBefore - 2);

        const response = await api.cancelBooking(booking.id);
        expect(response.status(), 'DELETE bookings/{id}').toBe(200);
        expect((await response.json()).success).toBe(true);

        // Seats are given back and the booking is gone from the bookings list.
        expect(await api.availableSeats(event.id)).toBe(seatsBefore);
        expect(await api.findBookingByRef(booking.bookingRef)).toBeUndefined();
        expect((await api.listBookings()).map((b) => b.bookingRef)).not.toContain(booking.bookingRef);
      });
    }
  });

  test('fetching a cancelled booking by id returns 404', async ({ api, bookings }) => {
    const [event] = await api.listEvents();
    expect(event, 'GET /events returns at least one event').toBeDefined();

    const booking = await api.createBooking(buildApiBooking(event.id, { quantity: 1 }));
    bookings.track(booking.bookingRef);

    await api.cancelBooking(booking.id);

    const response = await api.getBookingResponse(booking.id);
    expect(response.status(), 'GET bookings/{id} after cancel').toBe(404);
  });

  test('cancelling an already-cancelled booking returns 404', async ({ api, bookings }) => {
    const [event] = await api.listEvents();
    expect(event, 'GET /events returns at least one event').toBeDefined();

    const booking = await api.createBooking(buildApiBooking(event.id, { quantity: 1 }));
    bookings.track(booking.bookingRef);

    expect((await api.cancelBooking(booking.id)).status()).toBe(200);
    expect((await api.cancelBooking(booking.id)).status(), 'second cancel').toBe(404);
  });
});
