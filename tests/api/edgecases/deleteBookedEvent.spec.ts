import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';

/**
 * API edge case — create an event, book it, delete the event.
 * Deleting an event also deletes its bookings (cascade), so neither may be listed afterwards.
 */
test.describe('Edge case — delete an event that has a booking', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('deleting a booked event removes it from the events list and its booking from the bookings list', async ({ api, events, bookings }) => {
    const event = await api.createEvent(buildApiEvent());
    events.track(event.title);
    const booking = await api.createBooking(buildApiBooking(event.id, { quantity: 2 }));
    bookings.track(booking.bookingRef);

    //check that the event and booking are listed before deletion

    const listedEvent = (await api.listEvents()).find((e) => e.id === event.id);
    expect(listedEvent, 'event is listed before deletion').toBeDefined();

    const listedBooking = (await api.listBookings()).find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBooking, 'booking is listed before deletion').toBeDefined();


    const response = await api.removeEvent(event.id);
    expect(response.status(), 'DELETE events/{id}').toBe(200);

    // The event is gone from the list and from GET /events/{id}.
    const listedEventAfter = (await api.listEvents()).find((e) => e.id === event.id);
    expect(listedEventAfter, 'event is not listed after deletion').toBeUndefined();
    const getEventResponse = await api.getEventResponse(event.id);
    expect(getEventResponse.status(), 'GET events/{id} after deletion').toBe(404);

    const listedBookingAfter = (await api.listBookings()).find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBookingAfter, 'booking is not listed after deletion').toBeUndefined();
  });
});
