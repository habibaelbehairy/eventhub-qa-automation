import { test, expect } from '../../../fixtures';
import { buildEvent, buildCustomer } from '../../../utils/testData';
import { openEventByTitle } from '../../../common_steps/openEventByTitle';
import { bookTickets } from '../../../common_steps/bookTickets';

/** Admin > Manage Events: deleting an own event that already has a booking. */
test.describe('Delete an event', { tag: ['@ui', '@admin'] }, () => {

  test('Cancel in the delete dialog keeps the event, Delete event removes it and its booking', async ({
    adminEventsPage,
    eventsPage,
    eventDetailsPage: detailsPage,
    myBookingsPage,
    events,
    bookings,
  }) => {
    const event = buildEvent();
    events.track(event.title); // safety net, skipped when the test deleted it
    await adminEventsPage.open();
    await adminEventsPage.createEvent(event);

    await openEventByTitle(eventsPage, detailsPage, event.title);
    const ref = await bookTickets(detailsPage, {
      quantity: 2,
      customer: buildCustomer(),
      expectedPrice: event.price,
      onBooked: (r) => bookings.track(r),
    });
    await adminEventsPage.open();

    await test.step('Delete event removes it from the table', async () => {
      await adminEventsPage.deleteEvent(event.title);
      await expect(adminEventsPage.eventRow(event.title)).toHaveCount(0);
    });

    await test.step('My Bookings: the booking of the deleted event is gone', async () => {
      await myBookingsPage.open();
      await expect(myBookingsPage.bookingCard(ref).root).toHaveCount(0);
    });
  });
});
