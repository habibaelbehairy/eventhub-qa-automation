import { test, expect } from '../../../fixtures';
import { buildEvent, buildCustomer } from '../../../utils/testData';
import { openEventByTitle } from '../../../common_steps/openEventByTitle';

/**
 * An event with a decimal price (12.35). Observed: the event is created and can be booked, but
 * the UI shows the price rounded to whole dollars ($12) and the total as $36.
 *
 * Expected failure (defect 2). The API keeps the exact price (see tests/api/events/eventPrices.spec.ts),
 * so only the UI rounds it. The story has no rounding rule, so the Product Owner has to confirm
 * that cents must be shown. Marked as test.fail (xfail) until then.
 */
test.describe('Event with a decimal price', { tag: ['@ui', '@admin', '@booking', '@xfail'] }, () => {
  const PRICE = 12.35;
  const QUANTITY = 3;

  test('the UI shows the exact price and total, and the booking is confirmed with that total', async ({
    adminEventsPage,
    eventsPage,
    eventDetailsPage: detailsPage,
    events,
    bookings,
  }) => {
    test.fail(true, 'Defect 2: the UI rounds the decimal price and total; the API keeps them exact');
    const event = buildEvent({ price: PRICE });
    events.track(event.title);

    await test.step('Create the event in Manage Events', async () => {
      await adminEventsPage.open();
      await adminEventsPage.createEvent(event);
    });

    await openEventByTitle(eventsPage, detailsPage, event.title);

    await test.step(`Select ${QUANTITY} tickets: price and total show cents`, async () => {
      await detailsPage.setQuantity(QUANTITY);
      await expect(detailsPage.pricePerTicket).toContainText('12.35');
      await expect(detailsPage.total).toContainText('37.05');
    });

    await test.step('Book: the confirmation shows the exact total', async () => {
      await detailsPage.fillCustomerDetails(buildCustomer());
      await detailsPage.confirmBooking();
      await expect(detailsPage.confirmationHeading).toBeVisible();
      bookings.track(await detailsPage.confirmationBookingRefText());
      await expect(detailsPage.confirmationValue('Total')).toContainText('37.05');
    });
  });
});