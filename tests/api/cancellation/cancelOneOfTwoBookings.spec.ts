import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';
import type { ApiBooking } from '../../../types/api';

/**
 * API cancellation — cancelling one booking releases only its own seats.
 * Creates its own event so the seat counts are exact and the shared seeded events stay untouched.
 */
test.describe('Cancel one of two bookings', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('only the seats of the cancelled booking are released and the other booking stays confirmed', async ({ api, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent({ totalSeats: 20 }));
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);
    const firstResponse = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 3 }));
    expect(firstResponse.status).toBe(201);
    const first = firstResponse.body.data;
    bookings.track(first.bookingRef);
    const secondResponse = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 4 }));
    expect(secondResponse.status).toBe(201);
    const second = secondResponse.body.data;
    bookings.track(second.bookingRef);
    expect(await api.events.availableSeats(event.id), 'seats after both bookings').toBe(13);

    // Before cancelling: both bookings are found by id, by reference and in the bookings list.
    for (const b of [first, second]) {
      const byId = await api.bookings.getBookingResponse(b.id);
      expect(byId.status).toBe(200);
      expect(byId.body.data).toMatchObject({ id: b.id, bookingRef: b.bookingRef });
      const byRef = await api.bookings.getBookingByRefResponse(b.bookingRef);
      expect(byRef.status).toBe(200);
      expect(byRef.body.data).toMatchObject({ id: b.id, bookingRef: b.bookingRef });
    }
    const listBeforeResponse = await api.bookings.getBookingsResponse();
    expect(listBeforeResponse.status).toBe(200);
    const listBefore: ApiBooking[] = listBeforeResponse.body.data;
    expect(listBefore.map((b) => b.id)).toEqual(expect.arrayContaining([first.id, second.id]));
    expect(listBefore.map((b) => b.bookingRef)).toEqual(expect.arrayContaining([first.bookingRef, second.bookingRef]));

    const response = await api.bookings.cancelBooking(first.id);
    expect(response.status).toBe(200);

    expect(await api.events.availableSeats(event.id), 'only the 3 seats of the first booking come back').toBe(16);

    // After cancelling: the first booking is gone by id, by reference and from the list.
    expect((await api.bookings.getBookingResponse(first.id)).status).toBe(404);
    expect((await api.bookings.getBookingByRefResponse(first.bookingRef)).status).toBe(404);

    // The second booking is untouched by id, by reference and in the list.
    const remainingByIdResponse = await api.bookings.getBookingResponse(second.id);
    expect(remainingByIdResponse.status).toBe(200);
    expect(remainingByIdResponse.body.data).toMatchObject({ id: second.id, status: 'confirmed', quantity: 4 });
    const remainingResponse = await api.bookings.getBookingByRefResponse(second.bookingRef);
    expect(remainingResponse.status).toBe(200);
    const remaining = remainingResponse.body.data;
    expect(remaining.status, 'the other booking is untouched').toBe('confirmed');
    expect(remaining.quantity).toBe(4);

    const listAfterResponse = await api.bookings.getBookingsResponse();
    expect(listAfterResponse.status).toBe(200);
    const listAfter: ApiBooking[] = listAfterResponse.body.data;
    expect(listAfter.map((b) => b.id)).not.toContain(first.id);
    expect(listAfter.map((b) => b.bookingRef)).not.toContain(first.bookingRef);
    expect(listAfter.map((b) => b.id)).toContain(second.id);
    expect(listAfter.map((b) => b.bookingRef)).toContain(second.bookingRef);
  });
});
