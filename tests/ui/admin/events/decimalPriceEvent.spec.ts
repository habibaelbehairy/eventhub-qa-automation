import { test, expect, cleanUpTestData } from '../../../../fixtures';
import { buildEvent, buildCustomer } from '../../../../utils/testData';
import { openEventByTitle } from '../../../../common_steps/openEventByTitle';

/**
 * An event with a decimal price (49.99). Observed: the event is created and can be booked, but
 * the UI shows the price rounded to whole dollars ($50) and the total as $150.
 */
test.describe('Event with a decimal price', { tag: ['@ui', '@admin', '@booking'] }, () => {

  const PRICE = 49.99;
  const QUANTITY = 3;

  test('is created, shown on the Events page and can be booked', async ({
    adminEventsPage,
    eventsPage,
    eventDetailsPage: detailsPage,
    events,
    bookings,
  }) => {
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

  // Known bug: the UI rounds 49.99 to $50 and the total 149.97 to $150, so this test fails until it is fixed.
  test('the UI shows the exact price and total', async ({
    adminEventsPage,
    eventsPage,
    eventDetailsPage: detailsPage,
    events,
  }) => {
    const event = buildEvent({ price: PRICE });
    events.track(event.title);
    await adminEventsPage.open();
    await adminEventsPage.createEvent(event);

    await openEventByTitle(eventsPage, detailsPage, event.title);
    await detailsPage.setQuantity(QUANTITY);
    await expect(detailsPage.pricePerTicket).toContainText('49.99');
    await expect(detailsPage.total).toContainText('149.97');
  });
});
