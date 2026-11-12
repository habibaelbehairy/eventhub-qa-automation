import { request } from '@playwright/test';
import { test, expect } from '../../fixtures/apiOnly.fixture';
import { env } from '../../config/env';
import { buildApiEvent, buildApiBooking } from '../../utils/testData';

/**
 * API — booking validation and negative cases.
 * These guard the acceptance criteria from the other side: a booking must NOT be created when the
 * input is invalid, the event is missing, there are not enough seats, or the caller is not authorised.
 */
test.describe('POST /bookings — validation and errors', { tag: ['@api', '@booking', '@negative'] }, () => {
  test('A missing required field is rejected with a 400 validation error', async ({ api, events }) => {
    const event = await api.createEvent(buildApiEvent());
    events.track(event.title);

    const { customerEmail: _omitted, ...withoutEmail } = buildApiBooking(event.id);
    const response = await api.postBooking(withoutEmail);

    expect(response.status(), 'POST bookings without email').toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(JSON.stringify(body)).toContain('customerEmail');
  });

  for (const quantity of [0, -1, 11]) {
    test(`Quantity ${quantity} is rejected with a 400`, async ({ api, events }) => {
      const event = await api.createEvent(buildApiEvent());
      events.track(event.title);

      const response = await api.postBooking(buildApiBooking(event.id, { quantity }));
      expect(response.status(), `POST bookings quantity=${quantity}`).toBe(400);
    });
  }

  test('Booking a non-existent event returns 404 and creates nothing', async ({ api }) => {
    const response = await api.postBooking(buildApiBooking(999_999_999, { quantity: 1 }));
    expect(response.status(), 'POST bookings for unknown event').toBe(404);
  });

  test('Booking more seats than are available is rejected and does not change the seat count', async ({ api, events }) => {
    const event = await api.createEvent(buildApiEvent({ totalSeats: 2 }));
    events.track(event.title);

    const response = await api.postBooking(buildApiBooking(event.id, { quantity: 3 }));
    expect(response.status(), 'over-booking').toBe(400);

    // No seats were taken by the rejected request.
    expect(await api.availableSeats(event.id)).toBe(2);
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
