import { test, expect } from '../../../fixtures';
import { openEventFromHome, OpenedEvent } from '../../../common_steps/openEventFromHome';
import { bookTickets } from '../../../common_steps/bookTickets';
import { expectSeatsOnHome } from '../../../common_steps/expectSeatsOnHome';
import { buildCustomer } from '../../../utils/testData';

/**
 * "Clear all bookings" on My Bookings (UI only).
 * Books several tickets on several events, then clears everything with one click.
 * Note: "Clear all bookings" removes EVERY booking of the logged-in account, which is fine for the
 * dedicated test account. The `bookings` fixture deletes anything left if the test fails before clearing.
 */
const TICKETS_PER_EVENT = 2;
const NUMBER_OF_EVENTS = 3;

test.describe('Clear all bookings', { tag: ['@ui', '@cancellation'] }, () => {
  test(`book ${TICKETS_PER_EVENT} tickets on ${NUMBER_OF_EVENTS} different events, then clear all bookings`, async ({
    page,
    homePage,
    eventDetailsPage: detailsPage,
    myBookingsPage,
    bookings,
  }) => {
    const bookedEvents: OpenedEvent[] = [];
    const refs: string[] = [];

    const eventTitles = await test.step(`Pick ${NUMBER_OF_EVENTS} events with at least ${TICKETS_PER_EVENT} seats on the Home screen`, async () => {
      await homePage.nav.goToHome();
      await homePage.waitForLoaded();
      const titles: string[] = [];
      for (const card of await homePage.allEventCards()) {
        if (titles.length === NUMBER_OF_EVENTS) break;
        if (await card.matches({ minSeats: TICKETS_PER_EVENT })) titles.push((await card.title.innerText()).trim());
      }
      expect(titles.length, `events with at least ${TICKETS_PER_EVENT} seats`).toBe(NUMBER_OF_EVENTS);
      return titles;
    });

    for (const title of eventTitles) {
      await test.step(`Book ${TICKETS_PER_EVENT} tickets for "${title}"`, async () => {
        const event = await openEventFromHome(page, { title });
        bookedEvents.push(event);
        refs.push(
          await bookTickets(detailsPage, {
            quantity: TICKETS_PER_EVENT,
            customer: buildCustomer(),
            expectedPrice: event.price,
            onBooked: (ref) => bookings.track(ref), // safety net if the test fails before clearing
          }),
        );
      });
    }

    await test.step(`My Bookings lists all ${NUMBER_OF_EVENTS} bookings with ${TICKETS_PER_EVENT} tickets each`, async () => {
      await detailsPage.nav.goToMyBookings();
      await myBookingsPage.waitForLoaded();
      for (const [index, ref] of refs.entries()) {
        const card = myBookingsPage.bookingCard(ref);
        await expect(card.root).toBeVisible();
        await expect(card.eventTitle).toHaveText(bookedEvents[index].title);
        expect(await card.ticketsValue()).toBe(TICKETS_PER_EVENT);
        expect(await card.totalValue()).toBe(bookedEvents[index].price * TICKETS_PER_EVENT);
      }
    });

    await test.step('Click "Clear all bookings" and confirm', async () => {
      await expect(myBookingsPage.clearAllBookingsButton).toBeVisible();
      await myBookingsPage.clearAllBookings();
    });

    await test.step('My Bookings is empty and shows the empty state', async () => {
      await expect(myBookingsPage.bookingCards).toHaveCount(0);
      await expect(myBookingsPage.emptyStateHeading).toBeVisible();
      await expect(myBookingsPage.browseEventsButton).toBeVisible();
    });

    await test.step('Still empty after a reload (the bookings are really gone)', async () => {
      await page.reload();
      await myBookingsPage.waitForLoaded();
      await expect(myBookingsPage.bookingCards).toHaveCount(0);
    });

    await test.step(`All ${NUMBER_OF_EVENTS} events get their ${TICKETS_PER_EVENT} seats back`, async () => {
      await expectSeatsOnHome(page, bookedEvents);
    });
  });
});
