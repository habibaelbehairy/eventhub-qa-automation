import { test, expect } from '../../../fixtures';
import { buildApiEvent, buildCustomer } from '../../../utils/testData';

/**
 * UI edge case: the same customer books the same event twice.
 * The event is created through the API (setup only), so the shared demo events and their seat
 * counts stay untouched. The cleanup fixture deletes the bookings and the event afterwards.
 * Observed: the app allows it. The story does not say whether it should, so this pins the current
 * behaviour (see the Product Owner questions in the README).
 */
test.describe('Edge case: book the same event twice', { tag: ['@ui', '@edge', '@booking'] }, () => {
  test('two bookings of the same event by the same user both appear in My Bookings', async ({
    api,
    events,
    bookings,
    eventDetailsPage: detailsPage,
    myBookingsPage,
  }) => {
    const event = await api.events.createEvent(buildApiEvent({ totalSeats: 20 }));
    events.track(event.title);
    const customer = buildCustomer();

    const refs: string[] = [];
    for (const attempt of [1, 2]) {
      await test.step(`Booking ${attempt}: book 2 tickets`, async () => {
        await detailsPage.openEvent(event.id);
        await detailsPage.bookTickets(2, customer);
        await expect(detailsPage.confirmationHeading).toBeVisible();
        const ref = await detailsPage.confirmationBookingRefText();
        bookings.track(ref);
        refs.push(ref);
      });
    }

    expect(refs[1], 'each booking has its own reference').not.toBe(refs[0]);

    await test.step('My Bookings shows both bookings of the event', async () => {
      await myBookingsPage.open();
      await expect(myBookingsPage.bookingCardsForEvent(event.title)).toHaveCount(2);
      for (const ref of refs) await expect(myBookingsPage.bookingCard(ref).root).toBeVisible();
    });
  });
});
