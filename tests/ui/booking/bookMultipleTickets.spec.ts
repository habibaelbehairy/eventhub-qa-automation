import { test, expect, cleanUpTestData } from '../../../fixtures';
import { bookTickets } from '../../../common_steps/bookTickets';
import { CONCURRENCY_HINT } from '../../../common_steps/expectSeatsOnHome';
import type { EventCard } from '../../../page_objects/components/EventCard';
import { buildCustomer } from '../../../utils/testData';

/**
 * US-114 — Book multiple tickets (AC1, AC2, AC3)
 * Books on an existing event from the Home screen: the first card with enough seats for the
 * quantity. 10 is the maximum tickets per booking, so it is the upper boundary.
 * All checks use what the UI shows; the `bookings` fixture deletes the booking after the test.
 *
 * Shared-data race: another user may book or cancel on the same event while the test runs.
 *  - the seat count is read on the details page right after it loads and again right after
 *    the booking (page reload), to keep that window short;
 *  - a mismatch fails with a message that points at concurrent activity;
 *  - CI retries once (playwright.config.ts), so a one-off collision is reported as "flaky".
 */
const QUANTITIES = [2, 4, 10];

test.describe('Book multiple tickets', { tag: ['@ui', '@booking'] }, () => {
  test.afterAll(({ fileSession }) => cleanUpTestData(fileSession));

  for (const quantity of QUANTITIES) {
    test(`book ${quantity} tickets: total, confirmation, seats and My Bookings are correct`, async ({
      page,
      homePage,
      eventDetailsPage: detailsPage,
      myBookingsPage,
      api,
      bookings,
    }) => {
      const customer = buildCustomer();

      // -------------------------------------------------------------- Pick an event
      await test.step('Go to the Home screen with all event cards', async () => {
        await homePage.nav.goToHome();
        await homePage.waitForLoaded();
      });

      const card: EventCard = await test.step(`Loop through the cards to find an event with at least ${quantity} seats`, async () => {
        return homePage.findEventCard(undefined, { minSeats: quantity });
      });

      const eventData = {
        title: await card.title.innerText(),
        price: await card.priceValue(),
        seats: await card.seatsValue(),
      };
      const expectedTotal = eventData.price * quantity;

      const seatsBefore = await test.step('Click Book Now: details page shows the same title and price', async () => {
        await card.bookNow();
        await detailsPage.waitForLoaded();
        // Reload so the seat count is the server's current value. Without it the page can show a
        // stale count (the previous test's booking was deleted in the background), and the drop
        // measured below would be wrong (known defect UI-2: counts only refresh after a reload).
        await page.reload();
        await detailsPage.waitForLoaded();
        await expect(detailsPage.title).toHaveText(eventData.title);
        expect(await detailsPage.pricePerTicketValue()).toBe(eventData.price);
        // The details page is the source of truth for seats (the Home card can be a moment stale on
        // this shared site); just make sure it still has enough to book the quantity.
        const seats = await detailsPage.availableSeatsValue();
        expect(seats, `available seats for the booking. ${CONCURRENCY_HINT}`).toBeGreaterThanOrEqual(quantity);
        return seats;
      });

      // -------------------------------------------------------------- Book
      const bookingRef = await bookTickets(detailsPage, {
        quantity,
        customer,
        expectedPrice: eventData.price,
        onBooked: (ref) => bookings.track(ref),
      });

      await test.step('The booking was saved with the submitted data (checked through the API)', async () => {
        const saved = await api.bookings.findBookingByRef(bookingRef);
        expect(saved, 'GET /bookings/ref/{ref} returns the booking').toBeDefined();
        expect(saved).toMatchObject({
          quantity,
          status: 'confirmed',
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
        });
        expect(Number(saved!.totalPrice)).toBeCloseTo(expectedTotal, 2);
      });

      await test.step(`Available seats drop by at least ${quantity} (after reload)`, async () => {
        // Without a reload the page keeps showing the old count (known defect UI-2).
        await page.reload();
        await detailsPage.waitForLoaded();
        const seatsAfter = await detailsPage.availableSeatsValue();
        // Our booking removes `quantity` seats. On this shared event others may book too, so the
        // net drop can be larger, but never smaller than our own quantity.
        expect(
          seatsBefore - seatsAfter,
          `Seats went from ${seatsBefore} to ${seatsAfter}, expected a drop of at least ${quantity}. ${CONCURRENCY_HINT}`,
        ).toBeGreaterThanOrEqual(quantity);
      });

      // -------------------------------------------------------------- My Bookings
      await test.step(`My Bookings shows the booking with ${quantity} tickets and the correct total`, async () => {
        await detailsPage.nav.goToMyBookings();
        await myBookingsPage.waitForLoaded();
        const bookingCard = myBookingsPage.bookingCard(bookingRef);
        await expect(bookingCard.root).toBeVisible();
        await expect(bookingCard.eventTitle).toHaveText(eventData.title);
        await expect(bookingCard.status).toHaveText('confirmed');
        expect(await bookingCard.ticketsValue()).toBe(quantity);
        expect(await bookingCard.totalValue()).toBe(expectedTotal);
      });
    });
  }
});
