import { test, expect } from '../../../fixtures';
import { openEventFromHome } from '../../../common_steps/openEventFromHome';
import { bookTickets } from '../../../common_steps/bookTickets';
import { expectSeatsOnHome } from '../../../common_steps/expectSeatsOnHome';
import { buildCustomer } from '../../../utils/testData';

/**
 * US-114 AC4 — I can cancel a booking (UI only).
 * Each test books 1 ticket on a featured event (one run per featured category), then cancels it
 * from the My Bookings list, incl. dismissing the dialog first.
 * Cancelling from the Booking Details page is covered in cancelFromBookingDetails.spec.ts.
 * The `bookings` fixture deletes the booking after the test if the UI cancellation did not happen.
 */
const FEATURED_CATEGORIES = ['Concert', 'Conference', 'Festival'] as const;

test.describe('Cancel a booking for a featured event', { tag: ['@ui', '@cancellation'] }, () => {
  for (const category of FEATURED_CATEGORIES) {
    test(`cancel a ${category.toLowerCase()} booking from My Bookings`, async ({
      page,
      eventDetailsPage: detailsPage,
      myBookingsPage,
      bookings,
    }) => {
      const event = await openEventFromHome(page, { category, featured: true, minSeats: 1 });
      const ref = await bookTickets(detailsPage, {
        quantity: 1,
        customer: buildCustomer(),
        expectedPrice: event.price,
        onBooked: (r) => bookings.track(r), // safety net: deleted after the test if the cancel step fails
      });

      await test.step('The booking is listed in My Bookings as confirmed', async () => {
        await detailsPage.nav.goToMyBookings();
        await myBookingsPage.waitForLoaded();
        const card = myBookingsPage.bookingCard(ref);
        await expect(card.root).toBeVisible();
        await expect(card.eventTitle).toHaveText(event.title);
        await expect(card.status).toHaveText('confirmed');
      });

      // The dialog is opened twice on purpose, to check both of its outcomes (dismiss and confirm).
      await test.step('Open the cancel dialog: it shows the reference and seat count', async () => {
        await myBookingsPage.bookingCard(ref).clickCancel();
        const dialog = myBookingsPage.cancelDialog;
        await expect(dialog.root).toBeVisible();
        await expect(dialog.heading).toBeVisible();
        await expect(dialog.message).toContainText(ref);
        await expect(dialog.message).toContainText('release 1 seat(s)');
        await expect(dialog.confirmButton).toBeVisible();
        await expect(dialog.keepBookingButton).toBeVisible();
      });

      await test.step('Click "Cancel" in the dialog (dismiss): the booking is kept', async () => {
        // Backing out must KEEP the booking, otherwise a user could lose a booking by accident.
        await myBookingsPage.cancelDialog.dismiss();
        await expect(myBookingsPage.cancelDialog.root).toBeHidden();
        await expect(myBookingsPage.bookingCard(ref).root).toBeVisible();
      });

      await test.step('Open the cancel dialog again', async () => {
        await myBookingsPage.bookingCard(ref).clickCancel();
        await expect(myBookingsPage.cancelDialog.root).toBeVisible();
      });

      await test.step('Click "Yes, cancel it" (confirm): the booking is removed from My Bookings', async () => {
        await myBookingsPage.cancelDialog.confirm();
        await expect(myBookingsPage.cancelDialog.root).toBeHidden();
        await expect(myBookingsPage.bookingCard(ref).root).toHaveCount(0);
      });

      await test.step('The seat goes back to the event', async () => {
        await expectSeatsOnHome(page, [event]);
      });
    });
  }
});
