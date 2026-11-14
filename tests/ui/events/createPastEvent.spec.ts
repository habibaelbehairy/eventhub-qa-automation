import { test, expect } from '../../../fixtures';
import { buildEvent } from '../../../utils/testData';
import { pastDateTime } from '../../../utils/dates';

/**
 * UI — Manage Events: an event with a date in the past cannot be created.
 * The form shows "Must be a future date" and the number of events does not change, so nothing
 * needs to be cleaned up. Because a past event cannot be created, there is no test for booking one
 * (see "Why there is no test for booking a past event" in the README).
 */
test.describe('Create an event in the past', { tag: ['@ui', '@admin', '@events'] }, () => {
  test('the admin form does not create an event with a date in the past', async ({ adminEventsPage }) => {
    await adminEventsPage.open();
    const total = await adminEventsPage.totalEvents();

    await adminEventsPage.addEvent(buildEvent({ dateTime: pastDateTime() }));

    await expect(adminEventsPage.validationError('Must be a future date')).toBeVisible();
    expect(await adminEventsPage.totalEvents(), 'no event was created').toBe(total);
  });
});
