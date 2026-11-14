import { test, expect } from '../../../fixtures';
import { buildEvent, buildCustomer } from '../../../utils/testData';
import { openEventByTitle } from '../../../common_steps/openEventByTitle';

/**
 * An event with a decimal price (12.35). Observed: the event is created and can be booked, but
 * the UI shows the price rounded to whole dollars ($12) and the total as $36.
 */
test.describe('Event with a decimal price', { tag: ['@ui', '@admin', '@booking', '@xfail'] }, () => {

  const PRICE = 12.35;
  const QUANTITY = 3;

  // Expected failure (defect 2). The API keeps the exact price (see tests/api/edgecases/eventPrices.spec.ts),
  // so only the UI rounds it. The story has no rounding rule, so the Product Owner has to confirm
  // that cents must be shown. Marked as test.fail (xfail) until then.
  test('is created, shown on the Events page and can be booked', async ({
    adminEventsPage,
    eventsPage,
    eventDetailsPage: detailsPage,
    events,
    bookings,
  }) => {
    test.fail(true, 'Defect 2: the UI rounds the decimal price; the API keeps it exact');
    const event = buildEvent({ price: PRICE });
    events.track(event.title);

    await test.step('Create the event in Manage Events', async () => {
      await adminEventsPage.open();
      await adminEventsPage.createEvent(event);
    });

    await openEventByTitle(eventsPage, detailsPage, event.title);
    await expect(detailsPage.title).toHaveText(event.title);

    await test.step(`Book ${QUANTITY} tickets`, async () => {
      await detailsPage.setQuantity(QUANTITY);
      await detailsPage.fillCustomerDetails(buildCustomer());
      await detailsPage.confirmBooking();
      await expect(detailsPage.confirmationHeading).toBeVisible();
      const bookingRef = await detailsPage.confirmationBookingRefText();
      bookings.track(bookingRef);
    });
  });

  // Second xfail in this file (defect 2): the UI rounds 12.35 to whole dollars and the total 37.05
  // likewise, while the API returns "12.35" and 37.05. Marked as test.fail (xfail) until the Product
  // Owner confirms that the UI must show cents.
  test('the UI shows the exact price and total', async ({
    adminEventsPage,
    eventsPage,
    eventDetailsPage: detailsPage,
    events,
  }) => {
    test.fail(true, 'Defect 2: the UI rounds the decimal price and total; the API keeps them exact');
    const event = buildEvent({ price: PRICE });
    events.track(event.title);
    await adminEventsPage.open();
    await adminEventsPage.createEvent(event);

    await openEventByTitle(eventsPage, detailsPage, event.title);
    await detailsPage.setQuantity(QUANTITY);
    await expect(detailsPage.pricePerTicket).toContainText('12.35');
    await expect(detailsPage.total).toContainText('37.05');
  });
});
