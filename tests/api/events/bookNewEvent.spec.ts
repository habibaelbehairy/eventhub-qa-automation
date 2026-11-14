import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';
import type { ApiBooking } from '../../../api/types';

/**
 * API edge case — create an event and book it.
 * Creates its own event so the seat count is known and the shared seeded events stay untouched.
 */
test.describe('Edge case: book a newly created event', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('a newly created event can be booked and shows up in the events and bookings lists', async ({ api, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent({ totalSeats: 20 }));
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);

    const listedEvent = (await api.events.listEvents()).find((e) => e.id === event.id);
    expect(listedEvent, 'event is returned by GET /events').toBeDefined();
    expect(listedEvent!.availableSeats).toBe(20);

    const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 2 }));
    expect(response.status).toBe(201);
    const booking = response.body.data;
    bookings.track(booking.bookingRef);
    expect(booking.status).toBe('confirmed');

    // After booking, the event in the list has 2 seats fewer.
    const eventAfter = (await api.events.listEvents()).find((e) => e.id === event.id);
    expect(eventAfter!.availableSeats).toBe(18);

    // The booking is listed and has the correct embedded event.
    const listResponse = await api.bookings.getBookingsResponse();
    expect(listResponse.status).toBe(200);
    const bookingList: ApiBooking[] = listResponse.body.data;
    const listedBooking = bookingList.find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBooking, 'booking is returned by GET /bookings').toBeDefined();
    expect(listedBooking).toMatchObject({ id: booking.id, eventId: event.id, quantity: 2, status: 'confirmed' });
    expect(listedBooking!.event.id).toBe(event.id);
  });
});
