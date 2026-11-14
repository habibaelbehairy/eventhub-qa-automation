import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';
import type { ApiBooking } from '../../../types/api';

/**
 * API edge case — create an event, book it, delete the event.
 * Deleting an event also deletes its bookings (cascade), so neither may be listed afterwards.
 */
test.describe('Edge case: delete an event that has a booking', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('deleting a booked event removes it from the events list and its booking from the bookings list', async ({ api, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent());
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);
    const bookingResponse = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 2 }));
    expect(bookingResponse.status).toBe(201);
    const booking = bookingResponse.body.data;
    bookings.track(booking.bookingRef);

    //check that the event and booking are listed before deletion

    const listedEvent = (await api.events.listEvents()).find((e) => e.id === event.id);
    expect(listedEvent, 'event is listed before deletion').toBeDefined();

    const listBeforeResponse = await api.bookings.getBookingsResponse();
    expect(listBeforeResponse.status).toBe(200);
    const bookingsBefore: ApiBooking[] = listBeforeResponse.body.data;
    const listedBooking = bookingsBefore.find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBooking, 'booking is listed before deletion').toBeDefined();

    const byRefBeforeResponse = await api.bookings.getBookingByRefResponse(booking.bookingRef);
    expect(byRefBeforeResponse.status).toBe(200);
    const byRefBefore = byRefBeforeResponse.body.data;
    expect(byRefBefore).toMatchObject({ id: booking.id, eventId: event.id });
    expect(byRefBefore.event).toMatchObject({ id: event.id, title: event.title });
    const byIdBefore = await api.bookings.getBookingResponse(booking.id);
    expect(byIdBefore.status).toBe(200);
    expect(byIdBefore.body.data).toMatchObject({ id: booking.id, eventId: event.id });

    const response = await api.events.removeEvent(event.id);
    expect(response.status).toBe(200);

    // The event is gone from the list and from GET /events/{id}.
    const listedEventAfter = (await api.events.listEvents()).find((e) => e.id === event.id);
    expect(listedEventAfter, 'event is not listed after deletion').toBeUndefined();
    const getEventResponse = await api.events.getEventResponse(event.id);
    expect(getEventResponse.status).toBe(404);

    const listAfterResponse = await api.bookings.getBookingsResponse();
    expect(listAfterResponse.status).toBe(200);
    const bookingsAfter: ApiBooking[] = listAfterResponse.body.data;
    const listedBookingAfter = bookingsAfter.find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBookingAfter, 'booking is not listed after deletion').toBeUndefined();
    expect((await api.bookings.getBookingByRefResponse(booking.bookingRef)).status).toBe(404);
    const byIdAfter = await api.bookings.getBookingResponse(booking.id);
    expect(byIdAfter.status).toBe(404);
  });
});
