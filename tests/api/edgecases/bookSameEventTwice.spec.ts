import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';
import type { ApiBooking } from '../../../types/api';

/**
 * API edge case: the same customer books the same event twice.
 * Creates its own event so the seat count is known and the shared seeded events stay untouched.
 */
test.describe('Edge case: book the same event twice', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('two bookings of the same event by the same user are both created', async ({ api, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent({ totalSeats: 20 }));
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);
    const input = buildApiBooking(event.id, { quantity: 2 });

    const firstResponse = await api.bookings.postBooking(input);
    expect(firstResponse.status).toBe(201);
    const first = firstResponse.body.data;
    bookings.track(first.bookingRef);
    const secondResponse = await api.bookings.postBooking(input);
    expect(secondResponse.status).toBe(201);
    const second = secondResponse.body.data;
    bookings.track(second.bookingRef);

    expect(second.id, 'a second booking, not the first one returned again').not.toBe(first.id);
    expect(second.bookingRef, 'each booking has its own reference').not.toBe(first.bookingRef);

    const listResponse = await api.bookings.getBookingsResponse();
    expect(listResponse.status).toBe(200);
    const bookingList: ApiBooking[] = listResponse.body.data;
    const listed = bookingList.filter((b) => b.eventId === event.id);
    expect(listed.map((b) => b.id).sort()).toEqual([first.id, second.id].sort());
    expect(listed.map((b) => b.bookingRef).sort()).toEqual([first.bookingRef, second.bookingRef].sort());

    // Both bookings can be fetched by id and by reference.
    for (const b of [first, second]) {
      const byIdResponse = await api.bookings.getBookingResponse(b.id);
      expect(byIdResponse.status).toBe(200);
      expect(byIdResponse.body.data).toMatchObject({ id: b.id, bookingRef: b.bookingRef, eventId: event.id });

      const byRefResponse = await api.bookings.getBookingByRefResponse(b.bookingRef);
      expect(byRefResponse.status).toBe(200);
      expect(byRefResponse.body.data).toMatchObject({ id: b.id, bookingRef: b.bookingRef, eventId: event.id });
    }

    const after = (await api.events.listEvents()).find((e) => e.id === event.id);
    expect(after!.availableSeats, 'seats taken by both bookings').toBe(16);
  });
});
