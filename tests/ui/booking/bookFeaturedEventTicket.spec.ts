import { test, expect, cleanUpTestData } from '../../../fixtures';
import { bookTickets } from '../../../common_steps/bookTickets';
import { EventCard } from '../../../page_objects/components/EventCard';
import { buildCustomer } from '../../../utils/testData';
import { longDatePatternFromCardDate, parseTime12h } from '../../../utils/dates';

/**
 * US-114 — Book tickets for an event (AC1, AC2)
 * Full flow on a featured event of each category:
 * Home screen card -> Book Now -> event details -> booking form -> confirmation.
 * Featured events are the site's shared demo events, so only 1 ticket is booked; the `bookings`
 * fixture deletes the booking after the test (seats are restored).
 * Multiple tickets are covered in bookMultipleTickets.spec.ts.
 */
const FEATURED_CATEGORIES = ['Festival', 'Concert', 'Conference'] as const;

test.describe('Book a ticket for a featured event', { tag: ['@ui', '@booking'] }, () => {
  test.afterAll(({ fileSession }) => cleanUpTestData(fileSession));

  for (const category of FEATURED_CATEGORIES) {
    test(`book 1 ticket for a featured ${category.toLowerCase()} from the home screen`, async ({
      page,
      homePage,
      eventDetailsPage: detailsPage,
      myBookingsPage,
      api,
      bookings,
    }) => {
      const customer = buildCustomer();
      const quantity = 1;

      // -------------------------------------------------------------- Home screen card
      await test.step('Go to the Home screen with all event cards', async () => {
        await homePage.nav.goToHome();
        await homePage.waitForLoaded();
        await expect(homePage.featuredEventsHeading).toBeVisible();
      });

      const card: EventCard = await test.step(`Loop through the cards to find the featured ${category.toLowerCase()}`, async () => {
        return homePage.findEventCard(category, { featured: true });
      });

      const cardData = await test.step(`Card shows ${category} badge, title, date, location, price and seats`, async () => {
        await expect(card.root).toBeVisible();
        await expect(card.categoryBadge).toHaveText(category);
        await expect(card.title).not.toBeEmpty();
        await expect(card.date).toHaveText(/^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2}$/); // "Sat, 11 Jul"
        await expect(card.location).toHaveText(/^.+, .+$/); // "<venue>, <city>"
        await expect(card.price).toHaveText(/^\$[\d,]+(\.\d{2})?$/); // "$2,500"
        await expect(card.seats).toHaveText(/^\d+ seats? (available|left!?)$/);
        await expect(card.bookNowLink).toBeVisible();

        return {
          title: await card.title.innerText(),
          date: await card.date.innerText(),
          location: await card.location.innerText(),
          price: await card.priceValue(),
          seats: await card.seatsValue(),
        };
      });

      // -------------------------------------------------------------- Event details page
      await test.step('Click Book Now and the event details page loads', async () => {
        await card.bookNow();
        await expect(page).toHaveURL(/\/events\/\d+$/);
        await detailsPage.waitForLoaded();
      });

      await test.step(`Details show the same title with ${category} and Featured badges`, async () => {
        await expect(detailsPage.title).toHaveText(cardData.title);
        await expect(detailsPage.categoryBadge).toHaveText(category);
        await expect(detailsPage.featuredBadge).toBeVisible();
        await expect(detailsPage.featuredBanner).toBeVisible();
      });

      await test.step('Date matches the card', async () => {
        await expect(detailsPage.date).toHaveText(longDatePatternFromCardDate(cardData.date));
      });

      await test.step('Time matches the event time from the API (shown in the browser time zone)', async () => {
        // The card has no time, so the API's eventDate is the reference.
        const eventId = Number(page.url().split('/').pop());
        const event = await api.events.getEvent(eventId);

        const expected = await page.evaluate((iso: string) => {
          const d = new Date(iso);
          return { hours: d.getHours(), minutes: d.getMinutes() };
        }, event.eventDate);

        expect(parseTime12h(await detailsPage.time.innerText())).toEqual(expected);
      });

      await test.step('Venue and city match the card location', async () => {
        const venue = (await detailsPage.venue.innerText()).trim();
        const city = (await detailsPage.city.innerText()).trim();
        expect(`${venue}, ${city}`).toBe(cardData.location);
      });

      await test.step('Available seats and price match the card', async () => {
        await expect(detailsPage.availableSeats).toHaveText(/^\d+ \/ \d+ seats$/);
        expect(await detailsPage.availableSeatsValue()).toBe(cardData.seats);
        expect(await detailsPage.pricePerTicketValue()).toBe(cardData.price);
      });

      // -------------------------------------------------------------- Booking form
      await test.step('Booking form shows card price, quantity 1 and empty fields', async () => {
        await expect(detailsPage.bookTicketsHeading).toBeVisible();
        expect(await detailsPage.formPriceValue()).toBe(cardData.price);
        expect(await detailsPage.quantityValue()).toBe(1);
        await expect(detailsPage.decreaseButton).toBeDisabled();
        await expect(detailsPage.nameInput).toBeEmpty();
        await expect(detailsPage.emailInput).toBeEmpty();
        await expect(detailsPage.phoneInput).toBeEmpty();
      });

      // -------------------------------------------------------------- Book + confirmation
      const bookingRef = await bookTickets(detailsPage, {
        quantity,
        customer,
        expectedPrice: cardData.price,
        onBooked: (ref) => bookings.track(ref),
      });

      // -------------------------------------------------------------- My Bookings
      await test.step('The booking shows on the My Bookings page', async () => {
        await myBookingsPage.open();
        const bookingCard = myBookingsPage.bookingCard(bookingRef);
        await expect(bookingCard.root).toBeVisible();
        await expect(bookingCard.eventTitle).toHaveText(cardData.title);
        await expect(bookingCard.status).toHaveText('confirmed');
        expect(await bookingCard.ticketsValue()).toBe(quantity);
      });
    });
  }
});
