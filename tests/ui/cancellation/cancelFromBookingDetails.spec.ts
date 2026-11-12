import { test, expect, cleanUpTestData } from '../../../fixtures';
import { openEventFromHome } from '../../../common_steps/openEventFromHome';
import { bookTickets } from '../../../common_steps/bookTickets';
import { expectSeatsOnHome } from '../../../common_steps/expectSeatsOnHome';
import { buildCustomer } from '../../../utils/testData';

/**
 * US-114 AC4 — cancel a booking from the Booking Details page (UI only).
 * Books 1 ticket on a featured concert, opens it with "View Details" and cancels it there.
 * The `bookings` fixture deletes the booking after the test if the UI cancellation did not happen.
 */
test.describe('Cancel a booking from Booking Details', { tag: ['@ui', '@cancellation'] }, () => {
  test.afterAll(({ fileSession }) => cleanUpTestData(fileSession));

  test('cancel a booking from the Booking Details page', async ({
    page,
    eventDetailsPage: detailsPage,
    myBookingsPage,
    bookingDetailsPage,
    bookings,
  }) => {
    const event = await openEventFromHome(page, { category: 'Concert', featured: true, minSeats: 1 });
    const ref = await bookTickets(detailsPage, {
      quantity: 1,
      customer: buildCustomer(),
      expectedPrice: event.price,
      onBooked: (r) => bookings.track(r), // safety net: deleted after the test if the cancel step fails
    });

    await test.step('Open the booking with View Details', async () => {
      await detailsPage.nav.goToMyBookings();
      await myBookingsPage.waitForLoaded();
      await myBookingsPage.bookingCard(ref).viewDetails();
      await bookingDetailsPage.waitForLoaded();
      await expect(bookingDetailsPage.bookingRef).toHaveText(ref);
      await expect(bookingDetailsPage.status).toHaveText('confirmed');
    });

    await test.step('Cancel Booking opens the confirmation dialog', async () => {
      await bookingDetailsPage.cancelBookingButton.click();
      const dialog = bookingDetailsPage.cancelDialog;
      await expect(dialog.root).toBeVisible();
      await expect(dialog.heading).toBeVisible();
      await expect(dialog.confirmButton).toBeVisible();
      await expect(dialog.keepBookingButton).toBeVisible();
    });

    await test.step('Confirm the cancellation with "Yes, cancel it"', async () => {
      await bookingDetailsPage.cancelDialog.confirm();
      await expect(bookingDetailsPage.cancelDialog.root).toBeHidden();
    });

    await test.step('The booking is no longer in My Bookings', async () => {
      await myBookingsPage.open();
      await expect(myBookingsPage.bookingCard(ref).root).toHaveCount(0);
    });

    await test.step('The seat goes back to the event', async () => {
      await expectSeatsOnHome(page, [event]);
    });
  });
});
