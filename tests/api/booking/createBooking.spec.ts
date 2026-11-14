import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiBooking } from '../../../utils/testData';
import type { EventHubApi } from '../../../api/EventHubApi';
import type { ApiBooking } from '../../../api/types';

/**
 * API — book tickets for an event.
 * No event is created: every test lists the seeded events (GET /events, `isStatic`) and books one of them.
 * Events created by other tests (admin tests create and delete temporary ones) are ignored, so an event
 * cannot disappear in the middle of a loop and cause a 404.
 * The booking is cancelled afterwards by the cleanup fixture, which gives the seats back.
 */
async function listSeededEvents(api: EventHubApi) {
  return (await api.events.listEvents()).filter((e) => e.isStatic);
}

test.describe('POST /bookings - create a booking', { tag: ['@api', '@booking', '@seeded'] }, () => {
  // One test over all seeded events: book 2 tickets for each and check the confirmation (reference, status,
  // event, quantity, customer), the total price (price x quantity), that the seats go down by the quantity
  // and that the booking appears in the bookings list.
  test('every listed event can be booked: confirmation, total price, seats and bookings list are correct', async ({ api, bookings }) => {
    const events = await listSeededEvents(api);
    expect(events.length, 'GET /events returns seeded events').toBeGreaterThan(0);

    for (const event of events) {
      await test.step(`event ${event.id}: ${event.title}`, async () => {
        expect(event.availableSeats, 'the event has enough seats').toBeGreaterThanOrEqual(2);
        const seatsBefore = await api.events.availableSeats(event.id);

        const input = buildApiBooking(event.id, { quantity: 2 });
        const response = await api.bookings.postBooking(input);

        expect(response.status).toBe(201);

        const booking: ApiBooking = response.body.data;
        bookings.track(booking.bookingRef);

        // Confirmation
        expect(booking.bookingRef).toMatch(/^[A-Z0-9]+-[A-Z0-9]{6}$/);
        expect(booking.status).toBe('confirmed');
        expect(booking.eventId).toBe(event.id);
        expect(booking.quantity).toBe(input.quantity);
        expect(booking.customerName).toBe(input.customerName);
        expect(booking.customerEmail).toBe(input.customerEmail);
        expect(booking.customerPhone).toBe(input.customerPhone);

        // Total price
        expect(Number(booking.totalPrice), 'total = price x quantity').toBeCloseTo(Number(event.price) * 2, 2);

        // Seats
        expect(await api.events.availableSeats(event.id), 'seats go down by the quantity').toBe(seatsBefore - 2);

        // Bookings list
        // Single-booking lookups return the same booking with the booked event
        const byRefResponse = await api.bookings.getBookingByRefResponse(booking.bookingRef);
        expect(byRefResponse.status).toBe(200);
        const byRef = byRefResponse.body.data;
        expect(byRef).toMatchObject({ id: booking.id, bookingRef: booking.bookingRef, eventId: event.id });
        expect(byRef.event.id).toBe(event.id);
        expect(byRef.event.title).toBe(event.title);

        const byIdResponse = await api.bookings.getBookingResponse(booking.id);
        expect(byIdResponse.status).toBe(200);
        const byId = byIdResponse.body.data;
        expect(byId).toMatchObject({ id: booking.id, bookingRef: booking.bookingRef, eventId: event.id });
        expect(byId.event.id).toBe(event.id);
        expect(byId.event.title).toBe(event.title);

        const listResponse = await api.bookings.getBookingsResponse();
        expect(listResponse.status).toBe(200);
        const bookingList: ApiBooking[] = listResponse.body.data;
        const listed = bookingList.find((b) => b.bookingRef === booking.bookingRef);
        expect(listed, 'booking is returned by GET /bookings').toBeDefined();
        expect(listed).toMatchObject({ id: booking.id, eventId: event.id, quantity: 2, status: 'confirmed' });
        expect(listed!.event.id).toBe(event.id);
        expect(listed!.event.title).toBe(event.title);
      });
    }
  });
});
