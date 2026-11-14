import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';

/**
 * API edge case: the same customer books the same event twice.
 * Creates its own event so the seat count is known and the shared seeded events stay untouched.
 */
test.describe('Edge case: book the same event twice', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('two bookings of the same event by the same user are both created', async ({ api, events, bookings }) => {
    const event = await api.events.createEvent(buildApiEvent({ totalSeats: 20 }));
    events.track(event.title);
    const input = buildApiBooking(event.id, { quantity: 2 });

    const first = await api.bookings.createBooking(input);
    bookings.track(first.bookingRef);
    const second = await api.bookings.createBooking(input);
    bookings.track(second.bookingRef);

    expect(second.id, 'a second booking, not the first one returned again').not.toBe(first.id);
    expect(second.bookingRef, 'each booking has its own reference').not.toBe(first.bookingRef);

    const listed = (await api.bookings.listBookings()).filter((b) => b.eventId === event.id);
    expect(listed.map((b) => b.id).sort()).toEqual([first.id, second.id].sort());

    const after = (await api.events.listEvents()).find((e) => e.id === event.id);
    expect(after!.availableSeats, 'seats taken by both bookings').toBe(16);
  });
});
