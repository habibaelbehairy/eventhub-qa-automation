import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiBooking } from '../../../utils/testData';
import type { EventHubApi } from '../../../api/EventHubApi';

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

async function pickBookableEvent(api: EventHubApi, quantity: number) {
  const [event] = (await listSeededEvents(api)).sort((a, b) => b.availableSeats - a.availableSeats);
  expect(event, 'GET /events returns at least one event').toBeDefined();
  expect(event.availableSeats, 'the event has enough seats').toBeGreaterThanOrEqual(quantity);
  return event;
}

test.describe('POST /bookings - create a booking', { tag: ['@api', '@booking', '@seeded'] }, () => {
  test('booking is created and returns a confirmation with a booking reference', async ({ api, bookings }) => {
    const event = await pickBookableEvent(api, 2);

    const input = buildApiBooking(event.id, { quantity: 2 });
    const booking = await api.bookings.createBooking(input);
    bookings.track(booking.bookingRef);

    expect(booking.bookingRef).toMatch(/^[A-Z0-9]+-[A-Z0-9]{6}$/);
    expect(booking.status).toBe('confirmed');
    expect(booking.eventId).toBe(event.id);
    expect(booking.quantity).toBe(input.quantity);
    expect(booking.customerName).toBe(input.customerName);
    expect(booking.customerEmail).toBe(input.customerEmail);
  });

  test('the total price is the ticket price times the number of tickets', async ({ api, bookings }) => {
    const event = await pickBookableEvent(api, 3);

    const booking = await api.bookings.createBooking(buildApiBooking(event.id, { quantity: 3 }));
    bookings.track(booking.bookingRef);

    expect(Number(booking.totalPrice)).toBeCloseTo(Number(event.price) * 3, 2);
  });

  // for each listed event, book 2 tickets and check the booking appears in the bookings list 
  test('every listed event can be booked and the booking appears in the bookings list', async ({ api, bookings }) => {
    const events = await listSeededEvents(api);
    expect(events.length, 'GET /events returns seeded events').toBeGreaterThan(0);

    for (const event of events) {
      await test.step(`event ${event.id}: ${event.title}`, async () => {
        expect(event.availableSeats, 'the event has enough seats').toBeGreaterThanOrEqual(2);

        const booking = await api.bookings.createBooking(buildApiBooking(event.id, { quantity: 2 }));
        bookings.track(booking.bookingRef);

        const byRef = await api.bookings.findBookingByRef(booking.bookingRef);
        expect(byRef?.id).toBe(booking.id);

        const listed = (await api.bookings.listBookings()).find((b) => b.bookingRef === booking.bookingRef);
        expect(listed, 'booking is returned by GET /bookings').toBeDefined();
        expect(listed).toMatchObject({ id: booking.id, eventId: event.id, quantity: 2, status: 'confirmed' });
        expect(listed!.event.id).toBe(event.id);
        expect(listed!.event.title).toBe(event.title);
      });
    }
  });

  test('seats are decremented by the booked quantity', async ({ api, bookings }) => {
    const event = await pickBookableEvent(api, 4);
    const seatsBefore = await api.events.availableSeats(event.id);

    const booking = await api.bookings.createBooking(buildApiBooking(event.id, { quantity: 4 }));
    bookings.track(booking.bookingRef);

    expect(await api.events.availableSeats(event.id)).toBe(seatsBefore - 4);
  });
});
