import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';

/**
 * API edge cases — event prices that are not whole dollars: a decimal price and a free event.
 * Each test creates its own event; the `events` / `bookings` trackers delete it afterwards.
 * Purpose of the decimal test: show whether the rounding seen in the UI (see decimalPriceEvent.spec.ts)
 * comes from the backend or only from the UI. Result: the API keeps the exact value, so the UI rounds.
 * The API returns prices as strings (e.g. "12.35"), so they are compared as strings.
 */
test.describe('Edge case: decimal and free event prices', { tag: ['@api', '@booking', '@edgecase'] }, () => {
  test('an event with a decimal price keeps the exact price and total', async ({ api, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent({ price: 12.35 }));
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);
    expect(event.price, 'price returned by POST /events').toBe('12.35');

    const listed = (await api.events.listEvents()).find((e) => e.id === event.id);
    expect(listed!.price, 'price returned by GET /events').toBe('12.35');

    const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 3 }));
    expect(response.status).toBe(201);
    const booking = response.body.data;
    bookings.track(booking.bookingRef);
    expect(Number(booking.totalPrice), 'totalPrice for 3 tickets').toBeCloseTo(37.05, 2);
  });

  test('a free event (price 0) can be booked and the total is 0', async ({ api, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent({ price: 0, totalSeats: 20 }));
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);
    expect(Number(event.price), 'price returned by POST /events').toBe(0);

    const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 2 }));
    expect(response.status).toBe(201);
    const booking = response.body.data;
    bookings.track(booking.bookingRef);
    expect(booking.status).toBe('confirmed');
    expect(Number(booking.totalPrice), 'totalPrice').toBe(0);

    const after = (await api.events.listEvents()).find((e) => e.id === event.id);
    expect(after!.availableSeats).toBe(18);
  });
});
