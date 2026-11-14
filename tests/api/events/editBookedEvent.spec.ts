import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';

/**
 * API edge case — create an event, book it, edit the event.
 * The edit must show in the events list and in the event embedded in the booking.
 */
test.describe('Edge case: edit an event that has a booking', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('editing a booked event is reflected in the events list and in the bookings list', async ({ api, events, bookings }) => {
    const original = await api.events.createEvent(buildApiEvent({ totalSeats: 20 }));
    events.track(original.title);
    const booking = await api.bookings.createBooking(buildApiBooking(original.id, { quantity: 2 }));
    bookings.track(booking.bookingRef);

    // Check that the event and booking are listed before editing.
    const listedEventBefore = (await api.events.listEvents()).find((e) => e.id === original.id);
    expect(listedEventBefore, 'event is listed before editing').toBeDefined();

    const listedBookingBefore = (await api.bookings.listBookings()).find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBookingBefore, 'booking is listed before editing').toBeDefined();

    const edited = buildApiEvent({ category: 'Concert', city: 'Mumbai', price: 75, totalSeats: 20 });
    events.track(edited.title); // the cleanup finds the event by title, so track the new one too
    await api.events.updateEvent(original.id, edited);

    // Events list shows the new values.
    const listedEvent = (await api.events.listEvents()).find((e) => e.id === original.id);
    expect(listedEvent, 'event is still returned by GET /events').toBeDefined();
    expect(listedEvent).toMatchObject({ title: edited.title, city: 'Mumbai', category: 'Concert' });
    expect(Number(listedEvent!.price)).toBe(75);

    // The booking is still there and its embedded event shows the new values.
    const listedBooking = (await api.bookings.listBookings()).find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBooking, 'booking is still returned by GET /bookings').toBeDefined();
    expect(listedBooking!.eventId).toBe(original.id);
    expect(listedBooking!.event).toMatchObject({ id: original.id, title: edited.title, city: 'Mumbai', category: 'Concert' });
  });
});
