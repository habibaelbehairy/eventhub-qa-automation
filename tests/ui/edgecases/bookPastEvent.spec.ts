import { test, expect } from '../../../fixtures';
import { buildApiEvent, buildCustomer } from '../../../utils/testData';
import { pastIsoDateTime } from '../../../utils/dates';

/**
 * UI edge case — book an event that has already happened.
 * The past event is created through the API (setup only), so the shared demo events stay untouched.
 * The cleanup fixture deletes the event together with any booking made on it.
 */
test.describe('Edge case: book a past event', { tag: ['@ui', '@edge', '@booking', '@xfail'] }, () => {
  // Observed: the booking form works and the booking is confirmed. The story does not say whether
  // past events may be booked, so we don't know if this is a bug. Marked as test.fail (xfail) until
  // the Product Owner answers.
  test('a past event cannot be booked', async ({ api, events, eventDetailsPage: detailsPage }) => {
    test.fail(true, 'Past events can be booked; unclear if intended, no requirement exists');
    const event = await api.events.createEvent(buildApiEvent({ eventDate: pastIsoDateTime() }));
    events.track(event.title);

    await detailsPage.openEvent(event.id);
    await detailsPage.waitForLoaded();

    await detailsPage.fillCustomerDetails(buildCustomer());
    if (await detailsPage.confirmBookingButton.isEnabled()) await detailsPage.confirmBooking();

    await expect(detailsPage.confirmationHeading, 'no booking confirmation for a past event').toBeHidden();
  });
});
