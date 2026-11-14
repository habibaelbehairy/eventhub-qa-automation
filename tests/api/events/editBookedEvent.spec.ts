import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';
import type { EventHubApi } from '../../../api/EventHubApi';
import type { ApiBooking } from '../../../api/types';

/** GET /bookings/ref/{ref} and GET /bookings/{id} both return the booking with this embedded event. */
async function expectBookingLookups(api: EventHubApi, booking: ApiBooking, event: Record<string, unknown>) {
  const byRefResponse = await api.bookings.getBookingByRefResponse(booking.bookingRef);
  expect(byRefResponse.status).toBe(200);
  const byRef = byRefResponse.body.data;
  expect(byRef).toMatchObject({ id: booking.id, bookingRef: booking.bookingRef, eventId: booking.eventId });
  expect(byRef.event).toMatchObject(event);

  const byIdResponse = await api.bookings.getBookingResponse(booking.id);
  expect(byIdResponse.status).toBe(200);
  const byId = byIdResponse.body.data;
  expect(byId).toMatchObject({ id: booking.id, bookingRef: booking.bookingRef, eventId: booking.eventId });
  expect(byId.event).toMatchObject(event);
}

/**
 * API edge case — create an event, book it, edit the event.
 * The edit must show in the events list and in the event embedded in the booking.
 */
test.describe('Edge case: edit an event that has a booking', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('editing a booked event is reflected in the events list and in the bookings list', async ({ api, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent({ totalSeats: 20 }));
    expect(eventResponse.status).toBe(201);
    const original = eventResponse.body.data;
    events.track(original.title);
    const bookingResponse = await api.bookings.postBooking(buildApiBooking(original.id, { quantity: 2 }));
    expect(bookingResponse.status).toBe(201);
    const booking = bookingResponse.body.data;
    bookings.track(booking.bookingRef);

    // Check that the event and booking are listed before editing.
    const listedEventBefore = (await api.events.listEvents()).find((e) => e.id === original.id);
    expect(listedEventBefore, 'event is listed before editing').toBeDefined();

    const listBeforeResponse = await api.bookings.getBookingsResponse();
    expect(listBeforeResponse.status).toBe(200);
    const bookingsBefore: ApiBooking[] = listBeforeResponse.body.data;
    const listedBookingBefore = bookingsBefore.find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBookingBefore, 'booking is listed before editing').toBeDefined();
    await expectBookingLookups(api, booking, { id: original.id, title: original.title });

    const edited = buildApiEvent({ category: 'Concert', city: 'Mumbai', price: 75, totalSeats: 20 });
    events.track(edited.title); // the cleanup finds the event by title, so track the new one too
    const updateResponse = await api.events.putEvent(original.id, edited);
    expect(updateResponse.status).toBe(200);

    // Events list shows the new values.
    const listedEvent = (await api.events.listEvents()).find((e) => e.id === original.id);
    expect(listedEvent, 'event is still returned by GET /events').toBeDefined();
    expect(listedEvent).toMatchObject({ title: edited.title, city: 'Mumbai', category: 'Concert' });
    expect(Number(listedEvent!.price)).toBe(75);

    // The booking is still there and its embedded event shows the new values.
    const listAfterResponse = await api.bookings.getBookingsResponse();
    expect(listAfterResponse.status).toBe(200);
    const bookingsAfter: ApiBooking[] = listAfterResponse.body.data;
    const listedBooking = bookingsAfter.find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBooking, 'booking is still returned by GET /bookings').toBeDefined();
    expect(listedBooking!.eventId).toBe(original.id);
    expect(listedBooking!.event).toMatchObject({ id: original.id, title: edited.title, city: 'Mumbai', category: 'Concert' });
    await expectBookingLookups(api, booking, { id: original.id, title: edited.title, city: 'Mumbai', category: 'Concert' });
  });
});
