import { request } from '@playwright/test';
import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { env } from '../../../config/env';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';

/**
 * API — booking validation and negative cases.
 * These guard the acceptance criteria from the other side: a booking must NOT be created when the
 * input is invalid, the event is missing, there are not enough seats, or the caller is not authorised.
 */
test.describe('POST /bookings - validation and errors', { tag: ['@api', '@booking', '@negative'] }, () => {
  test('A missing required field is rejected with a 400 validation error', async ({ api, events }) => {
    const event = await api.events.createEvent(buildApiEvent());
    events.track(event.title);

    const { customerEmail: _omitted, ...withoutEmail } = buildApiBooking(event.id);
    const response = await api.bookings.postBooking(withoutEmail);

    expect(response.status(), 'POST bookings without email').toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(JSON.stringify(body)).toContain('customerEmail');
  });

  for (const quantity of [0, -1, 11]) {
    test(`Quantity ${quantity} is rejected with a 400`, async ({ api, events }) => {
      const event = await api.events.createEvent(buildApiEvent());
      events.track(event.title);

      const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity }));
      expect(response.status(), `POST bookings quantity=${quantity}`).toBe(400);
    });
  }

  test('Booking a non-existent event returns 404 and creates nothing', async ({ api }) => {
    const before = (await api.bookings.listBookings()).length;

    const response = await api.bookings.postBooking(buildApiBooking(999_999_999, { quantity: 1 }));
    expect(response.status(), 'POST bookings for unknown event').toBe(404);

    expect((await api.bookings.listBookings()).length, 'number of bookings is unchanged').toBe(before);
  });

  test('The maximum of 10 tickets is accepted and takes 10 seats', async ({ api, events, bookings }) => {
    const event = await api.events.createEvent(buildApiEvent({ totalSeats: 20 }));
    events.track(event.title);

    const booking = await api.bookings.createBooking(buildApiBooking(event.id, { quantity: 10 }));
    bookings.track(booking.bookingRef);

    expect(booking.quantity).toBe(10);
    expect(await api.events.availableSeats(event.id)).toBe(10);
  });

  for (const customerEmail of ['plainaddress', 'user@', '@example.com', 'user name@example.com']) {
    test(`Invalid email "${customerEmail}" is rejected with a 400`, async ({ api, events }) => {
      const event = await api.events.createEvent(buildApiEvent());
      events.track(event.title);

      const response = await api.bookings.postBooking(buildApiBooking(event.id, { customerEmail }));
      expect(response.status(), `POST bookings with email "${customerEmail}"`).toBe(400);
      expect(await api.events.availableSeats(event.id), 'no seats taken').toBe(event.availableSeats);
    });
  }

  for (const customerPhone of ['123456789', 'abcdefghij']) {
    test(`Invalid phone "${customerPhone}" is rejected with a 400`, async ({ api, events }) => {
      const event = await api.events.createEvent(buildApiEvent());
      events.track(event.title);

      const response = await api.bookings.postBooking(buildApiBooking(event.id, { customerPhone }));
      expect(response.status(), `POST bookings with phone "${customerPhone}"`).toBe(400);
      expect(await api.events.availableSeats(event.id), 'no seats taken').toBe(event.availableSeats);
    });
  }

  test('Booking more seats than are available is rejected and does not change the seat count', async ({ api, events }) => {
    const event = await api.events.createEvent(buildApiEvent({ totalSeats: 2 }));
    events.track(event.title);

    const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 3 }));
    expect(response.status(), 'over-booking').toBe(400);

    // No seats were taken by the rejected request.
    expect(await api.events.availableSeats(event.id)).toBe(2);
  });

  test('A request without a token is rejected with 401 (authorization is enforced)', async () => {
    const context = await request.newContext({ baseURL: `${env.apiBaseUrl}/` });
    try {
      const response = await context.post('bookings', {
        data: buildApiBooking(1, { quantity: 1 }),
      });
      expect(response.status(), 'POST bookings without a token').toBe(401);
    } finally {
      await context.dispose();
    }
  });
});
