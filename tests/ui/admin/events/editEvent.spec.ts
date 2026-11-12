import { test, expect, cleanUpTestData } from '../../../../fixtures';
import { buildEvent, buildCustomer } from '../../../../utils/testData';
import { openEventByTitle } from '../../../../common_steps/openEventByTitle';
import { bookTickets } from '../../../../common_steps/bookTickets';

/** Admin > Manage Events: editing an own event, also when it already has a booking. */
test.describe('Edit an event', { tag: ['@ui', '@admin'] }, () => {

  const QUANTITY = 2;

  test('editing a booked event updates the booking', async ({
    adminEventsPage,
    eventsPage,
    eventDetailsPage: detailsPage,
    myBookingsPage,
    events,
    bookings,
  }) => {
    const event = buildEvent();
    const edited = { ...event, title: `${event.title} edited`, city: 'Mumbai', price: 75, totalSeats: 30 };
    events.track(event.title);
    events.track(edited.title);

    await test.step('Create the event in Manage Events', async () => {
      await adminEventsPage.open();
      await adminEventsPage.createEvent(event);
    });

    await openEventByTitle(eventsPage, detailsPage, event.title);
    const ref = await bookTickets(detailsPage, {
      quantity: QUANTITY,
      customer: buildCustomer(),
      expectedPrice: event.price,
      onBooked: (r) => bookings.track(r),
    });

    await test.step('Back in Manage Events: edit title, city, price and seats, then Update Event', async () => {
      await adminEventsPage.open();
      await adminEventsPage.startEdit(event.title);
      await adminEventsPage.titleInput.fill(edited.title);
      await adminEventsPage.cityInput.fill(edited.city);
      await adminEventsPage.priceInput.fill(String(edited.price));
      await adminEventsPage.totalSeatsInput.fill(String(edited.totalSeats));
      await adminEventsPage.updateEvent();
      await adminEventsPage.expectRow(edited);
      await expect(adminEventsPage.editEventHeading).toBeHidden();
    });

    await test.step('My Bookings: the booking shows the edited event', async () => {
      await myBookingsPage.open();
      const card = myBookingsPage.bookingCard(ref);
      await expect(card.root).toBeVisible();
      await expect(card.eventTitle).toHaveText(edited.title);
      await expect(card.root).toContainText(edited.city);
      expect(await card.ticketsValue()).toBe(QUANTITY);
      await expect(card.status).toHaveText('confirmed');
    });
  });

});
