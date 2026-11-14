import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent } from '../../../utils/testData';
import { pastIsoDateTime } from '../../../utils/dates';

/**
 * API — an event with a date in the past cannot be created.
 * POST /events returns 400 with a message about eventDate and nothing is created, so there is
 * nothing to clean up.
 */
test.describe('Create an event in the past', { tag: ['@api', '@events', '@edgecase', '@negative'] }, () => {
  test('an event with a date in the past cannot be created', async ({ api }) => {
    const before = (await api.events.listEvents()).length;

    // buildApiEvent() uses futureIsoDateTime() by default, so we override it with a past date.
    const response = await api.events.postEvent(buildApiEvent({ eventDate: pastIsoDateTime() }));

    expect(response.status(), 'POST events with a past date').toBe(400);
    expect(JSON.stringify(await response.json())).toContain('eventDate');
    expect((await api.events.listEvents()).length, 'no event was created').toBe(before);
  });
});
