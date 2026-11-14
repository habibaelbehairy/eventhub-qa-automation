import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';
import type { EventHubApi } from '../../../api/EventHubApi';
import type { ApiBooking } from '../../../api/types';

/** GET /bookings/ref/{ref} and GET /bookings/{id} both return the booking with this embedded event. */
async function expectBookingLookups(api: EventHubApi, booking: ApiBooking, event: Record<string, unknown>) {
  const byRef = await api.bookings.findBookingByRef(booking.bookingRef);
  expect(byRef, 'GET bookings/ref/{ref} returns the booking').toBeDefined();
  expect(byRef).toMatchObject({ id: booking.id, bookingRef: booking.bookingRef, eventId: booking.eventId });
  expect(byRef!.event).toMatchObject(event);

  const byIdResponse = await api.bookings.getBookingResponse(booking.id);
  expect(byIdResponse.status(), 'GET bookings/{id}').toBe(200);
  const byId = (await byIdResponse.json()).data;
  expect(byId).toMatchObject({ id: booking.id, bookingRef: booking.bookingRef, eventId: booking.eventId });
  expect(byId.event).toMatchObject(event);
}

/**
 * API edge case — create an event, book it, edit the event.
 * The edit must show in the events list and in the event embedded in the booking.
 */
test.describe('Edge case: edit an event that has a booking', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('editing a booked event is reflected in the events list and in the bookings list', async ({ api, events, bookings }) => {
    const original = await api.events.createEvent(buildApiEvent({ totalSeats: 20 }));
    events.track(original.title);
    const booking = await api.bookings.createBooking(buildApiBooking(original.id, { quantity: 2 }));
    bookings.track(booking.bookingRef);

    // Check that the event and booking are listed before editing.
    const listedEventBefore = (await api.events.listEvents()).find((e) => e.id === original.id);
    expect(listedEventBefore, 'event is listed before editing').toBeDefined();

    const listedBookingBefore = (await api.bookings.listBookings()).find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBookingBefore, 'booking is listed before editing').toBeDefined();
    await expectBookingLookups(api, booking, { id: original.id, title: original.title });

    const edited = buildApiEvent({ category: 'Concert', city: 'Mumbai', price: 75, totalSeats: 20 });
    events.track(edited.title); // the cleanup finds the event by title, so track the new one too
    await api.events.updateEvent(original.id, edited);

    // Events list shows the new values.
    const listedEvent = (await api.events.listEvents()).find((e) => e.id === original.id);
    expect(listedEvent, 'event is still returned by GET /events').toBeDefined();
    expect(listedEvent).toMatchObject({ title: edited.title, city: 'Mumbai', category: 'Concert' });
    expect(Number(listedEvent!.price)).toBe(75);

    // The booking is still there and its embedded event shows the new values.
    const listedBooking = (await api.bookings.listBookings()).find((b) => b.bookingRef === booking.bookingRef);
    expect(listedBooking, 'booking is still returned by GET /bookings').toBeDefined();
    expect(listedBooking!.eventId).toBe(original.id);
    expect(listedBooking!.event).toMatchObject({ id: original.id, title: edited.title, city: 'Mumbai', category: 'Concert' });
    await expectBookingLookups(api, booking, { id: original.id, title: edited.title, city: 'Mumbai', category: 'Concert' });
  });
});
