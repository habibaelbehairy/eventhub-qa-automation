import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';

/**
 * API edge case — create an event and book it.
 * Creates its own event so the seat count is known and the shared seeded events stay untouched.
 */
test.describe('Edge case — book a newly created event', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('a newly created event can be booked and shows up in the events and bookings lists', async ({ api, events, bookings }) => {
    const event = await api.createEvent(buildApiEvent({ totalSeats: 20 }));
    events.track(event.title);

    const listedEvent = (await api.listEvents()).find((e) => e.id === event.id);
    expect(listedEvent, 'event is returned by GET /events').toBeDefined();
    expect(listedEvent!.availableSeats).toBe(20);

    const booking = await api.createBooking(buildApiBooking(event.id, { quantity: 2 }));
    bookings.track(booking.bookingRef);
    expect(booking.status).toBe('confirmed');

    // After booking, the event in the list has 2 seats fewer.
    const eventAfter = (await api.listEvents()).find((e) => e.id === event.id);
    expect(eventAfter!.availableSeats).toBe(18);

    const listedBooking = (await api.listBookings()).find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBooking, 'booking is returned by GET /bookings').toBeDefined();
    expect(listedBooking).toMatchObject({ id: booking.id, eventId: event.id, quantity: 2, status: 'confirmed' });
    expect(listedBooking!.event.id).toBe(event.id);
  });
});
