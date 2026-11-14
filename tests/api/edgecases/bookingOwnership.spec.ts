import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';
import type { ApiBooking } from '../../../api/types';

/**
 * API security — a booking belongs to the account that made it.
 * `api` is the owner, `otherApi` is a different account. The owner creates the booking on an event
 * of its own (so no shared demo event is touched); the other account then tries to read and cancel it.
 * The cleanup fixture deletes the booking and the event through the owner.
 */
test.describe('Bookings of another user', { tag: ['@api', '@booking', '@security'] }, () => {
  // Positive control: the refusals below only mean something if the owner can read the same booking.
  test('the owner can read their own booking by id, by reference and in the list', async ({ api, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent());
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);
    const bookingResponse = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 1 }));
    expect(bookingResponse.status).toBe(201);
    const booking = bookingResponse.body.data;
    bookings.track(booking.bookingRef);

    await test.step('GET bookings/{id} returns 200 with the booking', async () => {
      const response = await api.bookings.getBookingResponse(booking.id);
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ id: booking.id, bookingRef: booking.bookingRef, eventId: event.id });
    });

    await test.step('GET bookings/ref/{ref} returns 200 with the booking', async () => {
      const response = await api.bookings.getBookingByRefResponse(booking.bookingRef);
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(booking.id);
    });

    await test.step('The booking is in the owner\'s bookings list', async () => {
      const listResponse = await api.bookings.getBookingsResponse();
      expect(listResponse.status).toBe(200);
      const bookingList: ApiBooking[] = listResponse.body.data;
      const listed = bookingList.find((b) => b.id === booking.id);
      expect(listed, 'GET /bookings as the owner').toBeDefined();
    });
  });

  test('another account cannot read, list or cancel my booking', async ({ api, otherApi, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent());
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);
    const bookingResponse = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 1 }));
    expect(bookingResponse.status).toBe(201);
    const booking = bookingResponse.body.data;
    bookings.track(booking.bookingRef);

    await test.step('The other account cannot fetch the booking by id', async () => {
      const response = await otherApi.bookings.getBookingResponse(booking.id);
      expect(response.status).toBe(403);
    });

    await test.step('The other account cannot fetch the booking by reference', async () => {
      const response = await otherApi.bookings.getBookingByRefResponse(booking.bookingRef);
      expect(response.status).toBe(403);
    });

    await test.step('The booking is not in the other account\'s bookings list', async () => {
      const listResponse = await otherApi.bookings.getBookingsResponse();
      expect(listResponse.status).toBe(200);
      const bookingList: ApiBooking[] = listResponse.body.data;
      const listed = bookingList.find((b) => b.id === booking.id);
      expect(listed, 'GET /bookings as another user').toBeUndefined();
    });

    await test.step('The other account cannot cancel the booking', async () => {
      const response = await otherApi.bookings.cancelBooking(booking.id);
      expect(response.status).toBe(404);
    });

    await test.step('The booking still exists for its owner and the seats are still taken', async () => {
      const byRefResponse = await api.bookings.getBookingByRefResponse(booking.bookingRef);
      expect(byRefResponse.status).toBe(200);
      expect(byRefResponse.body.data.status).toBe('confirmed');
      expect(await api.events.availableSeats(event.id)).toBe(event.availableSeats - 1);
    });
  });
});
