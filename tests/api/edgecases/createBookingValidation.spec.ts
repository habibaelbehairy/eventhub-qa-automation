import { request } from '@playwright/test';
import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { env } from '../../../config/env';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';
import type { ApiResponse } from '../../../api/ApiResponse';
import type { ApiBooking } from '../../../types/api';

/** A rejected request has the 400 status, the "Validation failed" message and names the field at fault. */
function expectValidationError(response: ApiResponse, field: string): void {
  expect(response.status).toBe(400);
  expect(response.body.success, 'success flag').toBe(false);
  expect(response.body.error, 'error message').toBe('Validation failed');
  expect(response.body.details?.map((d) => d.field), 'field at fault').toContain(field);
}

/**
 * API — booking validation and negative cases.
 * These guard the acceptance criteria from the other side: a booking must NOT be created when the
 * input is invalid, the event is missing, there are not enough seats, or the caller is not authorised.
 */
test.describe('POST /bookings - validation and errors', { tag: ['@api', '@booking', '@negative'] }, () => {
  test('A missing required field is rejected with a 400 validation error', async ({ api, events }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent());
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);

    const { customerEmail: _omitted, ...withoutEmail } = buildApiBooking(event.id);
    const response = await api.bookings.postBooking(withoutEmail);

    expectValidationError(response, 'customerEmail');
  });

  for (const quantity of [0, -1, 11]) {
    test(`Quantity ${quantity} is rejected with a 400`, async ({ api, events }) => {
      const eventResponse = await api.events.postEvent(buildApiEvent());
      expect(eventResponse.status).toBe(201);
      const event = eventResponse.body.data;
      events.track(event.title);

      const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity }));
      expectValidationError(response, 'quantity');
    });
  }

  test('A fractional quantity (2.5) is rejected with a 400 and takes no seats', async ({ api, events }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent());
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);

    const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 2.5 }));
    expectValidationError(response, 'quantity');
    expect(await api.events.availableSeats(event.id), 'no seats taken').toBe(event.availableSeats);
  });

  for (const customerName of ['A', '']) {
    test(`Customer name "${customerName}" is rejected with a 400 and takes no seats`, async ({ api, events }) => {
      const eventResponse = await api.events.postEvent(buildApiEvent());
      expect(eventResponse.status).toBe(201);
      const event = eventResponse.body.data;
      events.track(event.title);

      const response = await api.bookings.postBooking(buildApiBooking(event.id, { customerName }));
      expectValidationError(response, 'customerName');
      expect(await api.events.availableSeats(event.id), 'no seats taken').toBe(event.availableSeats);
    });
  }

  test('A sold-out event rejects another booking', async ({ api, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent({ totalSeats: 2 }));
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);
    const firstResponse = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 2 }));
    expect(firstResponse.status).toBe(201);
    const booking = firstResponse.body.data;
    bookings.track(booking.bookingRef);
    expect(await api.events.availableSeats(event.id), 'event is sold out').toBe(0);

    const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 1 }));
    expect(response.status).toBe(400);
    expect(await api.events.availableSeats(event.id), 'seats stay at 0').toBe(0);
  });

  test('Booking a non-existent event returns 404 and creates nothing', async ({ api }) => {
    const beforeResponse = await api.bookings.getBookingsResponse();
    expect(beforeResponse.status).toBe(200);
    const before = (beforeResponse.body.data as ApiBooking[]).length;

    const response = await api.bookings.postBooking(buildApiBooking(999_999_999, { quantity: 1 }));
    expect(response.status).toBe(404);
    expect(response.body.success, 'error response').toBe(false);

    const afterResponse = await api.bookings.getBookingsResponse();
    expect(afterResponse.status).toBe(200);
    expect(afterResponse.body.data as ApiBooking[], 'number of bookings is unchanged').toHaveLength(before);
  });

  test('The maximum of 10 tickets is accepted and takes 10 seats', async ({ api, events, bookings }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent({ price: 40, totalSeats: 20 }));
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);

    const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 10 }));
    expect(response.status).toBe(201);
    const booking = response.body.data;
    bookings.track(booking.bookingRef);

    expect(booking.quantity).toBe(10);
    expect(booking.status, 'booking status').toBe('confirmed');
    expect(Number(booking.totalPrice), 'total for 10 tickets').toBeCloseTo(400, 2);
    expect(await api.events.availableSeats(event.id)).toBe(10);
  });

  for (const customerEmail of ['plainaddress', 'user@', '@example.com', 'user name@example.com']) {
    test(`Invalid email "${customerEmail}" is rejected with a 400`, async ({ api, events }) => {
      const eventResponse = await api.events.postEvent(buildApiEvent());
      expect(eventResponse.status).toBe(201);
      const event = eventResponse.body.data;
      events.track(event.title);

      const response = await api.bookings.postBooking(buildApiBooking(event.id, { customerEmail }));
      expectValidationError(response, 'customerEmail');
      expect(await api.events.availableSeats(event.id), 'no seats taken').toBe(event.availableSeats);
    });
  }

  for (const customerPhone of ['123456789', 'abcdefghij']) {
    test(`Invalid phone "${customerPhone}" is rejected with a 400`, async ({ api, events }) => {
      const eventResponse = await api.events.postEvent(buildApiEvent());
      expect(eventResponse.status).toBe(201);
      const event = eventResponse.body.data;
      events.track(event.title);

      const response = await api.bookings.postBooking(buildApiBooking(event.id, { customerPhone }));
      expectValidationError(response, 'customerPhone');
      expect(await api.events.availableSeats(event.id), 'no seats taken').toBe(event.availableSeats);
    });
  }

  test('Booking more seats than are available is rejected and does not change the seat count', async ({ api, events }) => {
    const eventResponse = await api.events.postEvent(buildApiEvent({ totalSeats: 2 }));
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body.data;
    events.track(event.title);

    const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 3 }));
    expect(response.status).toBe(400);
    expect(response.body.error, 'message names the seats left').toMatch(/2 seat\(s\) available/);

    // No seats were taken by the rejected request.
    expect(await api.events.availableSeats(event.id)).toBe(2);
  });

  test('A request without a token is rejected with 401 (authorization is enforced)', async () => {
    const context = await request.newContext({ baseURL: `${env.apiBaseUrl}/` });
    try {
      const response = await context.post('bookings', {
        data: buildApiBooking(1, { quantity: 1 }),
      });
      expect(response.status()).toBe(401);
    } finally {
      await context.dispose();
    }
  });
});
