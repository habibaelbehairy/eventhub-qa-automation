import { test, expect } from '../../../fixtures/apiOnly.fixture';
import { buildApiEvent, buildApiBooking } from '../../../utils/testData';
import { pastIsoDateTime } from '../../../utils/dates';

/**
 * API edge case — book an event that has already happened.
 * Creates its own past event, so the shared demo events stay untouched. The cleanup fixture
 * deletes the event together with any booking made on it.
 */
test.describe('Edge case: book a past event', { tag: ['@api', '@booking', '@edgecase', '@xfail'] }, () => {
  // Observed: the booking is accepted (201). The story does not say whether past events may be
  // booked, so we don't know if this is a bug. Marked as test.fail (xfail) until the Product Owner answers.
  test('a booking for an event in the past is rejected', async ({ api, events, bookings }) => {
    test.fail(true, 'Past events can be booked; unclear if intended, no requirement exists');
    const event = await api.events.createEvent(buildApiEvent({ eventDate: pastIsoDateTime() }));
    events.track(event.title);

    const response = await api.bookings.postBooking(buildApiBooking(event.id, { quantity: 1 }));
    if (response.status() === 201) bookings.track((await response.json()).data.bookingRef);

    expect(response.status(), 'POST bookings for a past event').toBeGreaterThanOrEqual(400);
    expect(response.status(), 'POST bookings for a past event').toBeLessThan(500);
  });
});
