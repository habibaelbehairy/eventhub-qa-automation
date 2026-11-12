import { test, expect } from '../../../fixtures';
import { openEventFromHome } from '../../../common_steps/openEventFromHome';
import { bookTickets } from '../../../common_steps/bookTickets';
import { buildCustomer } from '../../../utils/testData';

/**
 * Booking Details page "/bookings/{id}" (UI only), opened with "View Details" on My Bookings.
 * Books tickets on a featured concert, then checks the details page shows the same booking.
 * The `bookings` fixture deletes the booking after the test.
 */
const TICKETS = 2;

test.describe('Verify booking details', { tag: ['@ui', '@booking'] }, () => {
  test(`book ${TICKETS} tickets and verify the booking details page`, async ({
    page,
    eventDetailsPage: detailsPage,
    myBookingsPage,
    bookingDetailsPage,
    bookings,
  }) => {
    const customer = buildCustomer();
    const event = await openEventFromHome(page, { category: 'Concert', featured: true, minSeats: TICKETS });
    const ref = await bookTickets(detailsPage, {
      quantity: TICKETS,
      customer,
      expectedPrice: event.price,
      onBooked: (r) => bookings.track(r),
    });

    await test.step('Open the booking with View Details', async () => {
      await detailsPage.nav.goToMyBookings();
      await myBookingsPage.waitForLoaded();
      await myBookingsPage.bookingCard(ref).viewDetails();
      await bookingDetailsPage.waitForLoaded();
    });

    await test.step('Header shows the event title, booking reference and status "confirmed"', async () => {
      await expect(bookingDetailsPage.eventTitle).toHaveText(event.title);
      await expect(bookingDetailsPage.bookingRef).toHaveText(ref);
      await expect(bookingDetailsPage.status).toHaveText('confirmed');
    });

    await test.step('Event Details, Customer Details and Payment Summary blocks are shown', async () => {
      await expect(bookingDetailsPage.eventDetailsSection).toBeVisible();
      await expect(bookingDetailsPage.customerDetailsSection).toBeVisible();
      await expect(bookingDetailsPage.paymentSummarySection).toBeVisible();
    });

    await test.step('Customer Details match what was entered in the booking form', async () => {
      await expect(bookingDetailsPage.customerDetailsSection).toContainText(customer.name);
      await expect(bookingDetailsPage.customerDetailsSection).toContainText(customer.email);
      await expect(bookingDetailsPage.customerDetailsSection).toContainText(customer.phone);
    });

    await test.step(`Payment Summary: ${TICKETS} tickets, price per ticket and total = price × ${TICKETS}`, async () => {
      expect(await bookingDetailsPage.paymentValue('Tickets')).toBe(TICKETS);
      expect(await bookingDetailsPage.paymentValue('Price per ticket')).toBe(event.price);
      expect(await bookingDetailsPage.paymentValue('Total Paid')).toBe(event.price * TICKETS);
    });

    await test.step('"Cancel Booking" is offered for a confirmed booking', async () => {
      await expect(bookingDetailsPage.cancelBookingButton).toBeVisible();
    });

    await test.step('"← Back to My Bookings" returns to the list with the booking still there', async () => {
      await bookingDetailsPage.backToMyBookingsButton.click();
      await myBookingsPage.waitForLoaded();
      await expect(myBookingsPage.bookingCard(ref).root).toBeVisible();
    });
  });
});
