import { request } from '@playwright/test';
import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { env } from '../../../config/env';
import { buildApiEvent } from '../../../utils/testData';

/**
 * API — event validation and authorization (the API side of the UI "event form validation" and
 * "anonymous access" tests). An event must NOT be created when the input is invalid or the caller
 * is not logged in. Nothing is created by a passing run, so there is nothing to clean up.
 */
test.describe('POST /events - validation and errors', { tag: ['@api', '@events', '@negative'] }, () => {
  for (const field of ['title', 'city', 'venue', 'eventDate', 'price', 'totalSeats'] as const) {
    test(`A missing ${field} is rejected with a 400`, async ({ api }) => {
      const { [field]: _omitted, ...body } = buildApiEvent();
      const response = await api.events.postEvent(body);

      expect(response.status(), `POST events without ${field}`).toBe(400);
      expect((await response.json()).success).toBe(false);
    });
  }

  for (const title of ['', '   ']) {
    test(`A title of "${title}" is rejected with a 400`, async ({ api }) => {
      const response = await api.events.postEvent(buildApiEvent({ title }));
      expect(response.status(), `POST events with title "${title}"`).toBe(400);
    });
  }

  test('A negative price is rejected with a 400', async ({ api }) => {
    const response = await api.events.postEvent(buildApiEvent({ price: -1 }));
    expect(response.status(), 'POST events with price -1').toBe(400);
  });

  for (const totalSeats of [0, -5]) {
    test(`${totalSeats} total seats is rejected with a 400`, async ({ api }) => {
      const response = await api.events.postEvent(buildApiEvent({ totalSeats }));
      expect(response.status(), `POST events with totalSeats ${totalSeats}`).toBe(400);
    });
  }

  test('Requests without a token are rejected with 401 (authorization is enforced)', async () => {
    const context = await request.newContext({ baseURL: `${env.apiBaseUrl}/` });
    try {
      const create = await context.post('events', { data: buildApiEvent() });
      expect(create.status(), 'POST events without a token').toBe(401);
      const bookings = await context.get('bookings');
      expect(bookings.status(), 'GET bookings without a token').toBe(401);
    } finally {
      await context.dispose();
    }
  });
});
