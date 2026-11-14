import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';

/**
 * API security — a booking belongs to the account that made it.
 * `api` is the owner, `otherApi` is a different account. The owner creates the booking on an event
 * of its own (so no shared demo event is touched); the other account then tries to read and cancel it.
 * The cleanup fixture deletes the booking and the event through the owner.
 */
test.describe('Bookings of another user', { tag: ['@api', '@booking', '@security'] }, () => {
  // Positive control: the refusals below only mean something if the owner can read the same booking.
  test('the owner can read their own booking by id, by reference and in the list', async ({ api, events, bookings }) => {
    const event = await api.events.createEvent(buildApiEvent());
    events.track(event.title);
    const booking = await api.bookings.createBooking(buildApiBooking(event.id, { quantity: 1 }));
    bookings.track(booking.bookingRef);

    await test.step('GET bookings/{id} returns 200 with the booking', async () => {
      const response = await api.bookings.getBookingResponse(booking.id);
      expect(response.status(), 'GET bookings/{id} as the owner').toBe(200);
      expect((await response.json()).data).toMatchObject({ id: booking.id, bookingRef: booking.bookingRef, eventId: event.id });
    });

    await test.step('GET bookings/ref/{ref} returns 200 with the booking', async () => {
      const response = await api.bookings.getBookingByRefResponse(booking.bookingRef);
      expect(response.status(), 'GET bookings/ref/{ref} as the owner').toBe(200);
      expect((await response.json()).data.id).toBe(booking.id);
    });

    await test.step('The booking is in the owner\'s bookings list', async () => {
      const listed = (await api.bookings.listBookings()).find((b) => b.id === booking.id);
      expect(listed, 'GET /bookings as the owner').toBeDefined();
    });
  });

  test('another account cannot read, list or cancel my booking', async ({ api, otherApi, events, bookings }) => {
    const event = await api.events.createEvent(buildApiEvent());
    events.track(event.title);
    const booking = await api.bookings.createBooking(buildApiBooking(event.id, { quantity: 1 }));
    bookings.track(booking.bookingRef);

    await test.step('The other account cannot fetch the booking by id', async () => {
      const response = await otherApi.bookings.getBookingResponse(booking.id);
      expect([403, 404], 'GET bookings/{id} as another user').toContain(response.status());
    });

    await test.step('The other account cannot fetch the booking by reference', async () => {
      const response = await otherApi.bookings.getBookingByRefResponse(booking.bookingRef);
      expect([403, 404], 'GET bookings/ref/{ref} as another user').toContain(response.status());
    });

    await test.step('The booking is not in the other account\'s bookings list', async () => {
      const listed = (await otherApi.bookings.listBookings()).find((b) => b.id === booking.id);
      expect(listed, 'GET /bookings as another user').toBeUndefined();
    });

    await test.step('The other account cannot cancel the booking', async () => {
      const response = await otherApi.bookings.cancelBooking(booking.id);
      expect([403, 404], 'DELETE bookings/{id} as another user').toContain(response.status());
    });

    await test.step('The booking still exists for its owner and the seats are still taken', async () => {
      expect((await api.bookings.findBookingByRef(booking.bookingRef))?.status).toBe('confirmed');
      expect(await api.events.availableSeats(event.id)).toBe(event.availableSeats - 1);
    });
  });
});
