import { test, expect } from '../../../fixtures';
import { buildEvent, buildCustomer } from '../../../utils/testData';
import { openEventByTitle } from '../../../common_steps/openEventByTitle';

/**
 * A free event (price 0): the form accepts it (see eventFormValidation.spec.ts); here the event is
 * created, shown with a zero price and booked. Cleanup is done by the `events` / `bookings` trackers.
 */
test.describe('Free event (price 0)', { tag: ['@ui', '@admin', '@booking'] }, () => {
  const QUANTITY = 2;

  test('is created, shown with price 0 and can be booked', async ({
    adminEventsPage,
    eventsPage,
    eventDetailsPage: detailsPage,
    events,
    bookings,
  }) => {
    const event = buildEvent({ price: 0 });
    events.track(event.title);

    await test.step('Create the event in Manage Events', async () => {
      await adminEventsPage.open();
      await adminEventsPage.createEvent(event);
      await adminEventsPage.expectRow(event);
    });

    await openEventByTitle(eventsPage, detailsPage, event.title);

    await test.step('The price and the total are 0', async () => {
      await expect(detailsPage.pricePerTicket).toContainText('$0');
      await detailsPage.setQuantity(QUANTITY);
      await expect(detailsPage.total).toContainText('$0');
    });

    await test.step(`Book ${QUANTITY} tickets`, async () => {
      await detailsPage.fillCustomerDetails(buildCustomer());
      await detailsPage.confirmBooking();
      await expect(detailsPage.confirmationHeading).toBeVisible();
      bookings.track(await detailsPage.confirmationBookingRefText());
    });
  });
});
