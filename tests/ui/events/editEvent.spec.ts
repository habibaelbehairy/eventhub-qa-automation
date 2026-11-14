import { test, expect } from '../../../fixtures';
import { buildEvent, buildCustomer } from '../../../utils/testData';
import { openEventByTitle } from '../../../common_steps/openEventByTitle';
import { bookTickets } from '../../../common_steps/bookTickets';

/** Admin > Manage Events: editing an own event, also when it already has a booking. */
test.describe('Edit an event', { tag: ['@ui', '@admin'] }, () => {

  const QUANTITY = 2;

  test('editing a booked event updates the booking', async ({
    adminEventsPage,
    eventsPage,
    eventDetailsPage: detailsPage,
    myBookingsPage,
    bookingDetailsPage,
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

    await test.step('Event details show the created event', async () => {
      await expect(detailsPage.title).toHaveText(event.title);
      await expect(detailsPage.city).toContainText(event.city);
      await expect(detailsPage.venue).toContainText(event.venue);
      expect(await detailsPage.pricePerTicketValue()).toBe(event.price);
      expect(await detailsPage.availableSeatsValue()).toBe(event.totalSeats);
    });

    const ref = await bookTickets(detailsPage, {
      quantity: QUANTITY,
      customer: buildCustomer(),
      expectedPrice: event.price,
      onBooked: (r) => bookings.track(r),
    });

    // The list can render before the server returns the bookings under load: re-open the page until the card shows.
    const openBookingDetails = async () => {
      const card = myBookingsPage.bookingCard(ref);
      await expect(async () => {
        await myBookingsPage.open();
        await expect(card.root).toBeVisible({ timeout: 5_000 });
      }).toPass({ timeout: 30_000 });
      await card.viewDetails();
      await bookingDetailsPage.waitForLoaded();
      await expect(bookingDetailsPage.bookingRef).toHaveText(ref);
    };

    await test.step('Booking details before the edit show the original event', async () => {
      await openBookingDetails();
      await expect(bookingDetailsPage.eventTitle).toHaveText(event.title);
      await expect(bookingDetailsPage.eventDetailsSection).toContainText(event.city);
      await expect(bookingDetailsPage.status).toHaveText('confirmed');
      expect(await bookingDetailsPage.paymentValue('Tickets')).toBe(QUANTITY);
      expect(await bookingDetailsPage.paymentValue('Price per ticket')).toBe(event.price);
      expect(await bookingDetailsPage.paymentValue('Total Paid')).toBe(event.price * QUANTITY);
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

    await test.step('Booking details after the edit show the edited event', async () => {
      await openBookingDetails();
      await expect(bookingDetailsPage.eventTitle).toHaveText(edited.title);
      await expect(bookingDetailsPage.eventDetailsSection).toContainText(edited.city);
      await expect(bookingDetailsPage.status).toHaveText('confirmed');
      expect(await bookingDetailsPage.paymentValue('Tickets')).toBe(QUANTITY);
    });
  });

});
