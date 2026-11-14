import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';
import type { ApiBooking } from '../../../api/types';

/**
 * API security — an event created by one account cannot be booked by another account.
 * Checked on the live API: the other account gets 404, as if the event did not exist.
 * The event is created with `api`, the booking attempt is made with `otherApi`.
 */
test.describe('Booking an event created by another user', { tag: ['@api', '@booking', '@security'] }, () => {
  test('another account gets 404 and no seats are taken', async ({ api, otherApi, events }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent({ totalSeats: 20 }));
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);

    const response = await otherApi.bookings.postBooking(buildApiBooking(event.id, { quantity: 2 }));
    expect(response.status).toBe(404);

    expect(await api.events.availableSeats(event.id), 'no seats taken').toBe(20);
    const listResponse = await otherApi.bookings.getBookingsResponse();
    expect(listResponse.status).toBe(200);
    const bookingList: ApiBooking[] = listResponse.body.data;
    expect(bookingList.some((b) => b.eventId === event.id), 'no booking was created').toBe(false);
  });
});