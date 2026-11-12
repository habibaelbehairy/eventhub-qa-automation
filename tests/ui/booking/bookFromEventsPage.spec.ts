import { test, expect, cleanUpTestData } from '../../../fixtures';
import { bookTickets } from '../../../common_steps/bookTickets';
import { EventCard } from '../../../page_objects/components/EventCard';
import { buildCustomer } from '../../../utils/testData';

/**
 * US-114 — Book tickets for an event (AC1, AC2), second entry point:
 * Events page -> filter by category -> card -> Book Now -> book 1 ticket.
 * The detailed card/details/form checks live in bookFeaturedEventTicket.spec.ts (Home entry point);
 * here we only check that the filtered card leads to the same event and that booking works.
 * Filter behaviour itself is tested in tests/ui/events/filterEvents.spec.ts.
 */
const CATEGORIES_WITH_EVENTS = ['Concert', 'Conference', 'Festival'] as const;

test.describe('Book a ticket from the Events page', { tag: ['@ui', '@booking'] }, () => {
  test.afterAll(({ fileSession }) => cleanUpTestData(fileSession));

  for (const category of CATEGORIES_WITH_EVENTS) {
    test(`filter by ${category} and book 1 ticket`, async ({ page, eventsPage, eventDetailsPage: detailsPage, bookings }) => {

      await test.step('Go to the Events page from the navigation bar', async () => {
        await eventsPage.nav.goToEvents();
        await eventsPage.waitForLoaded();
      });

      await test.step(`Filter by category ${category}`, async () => {
        await eventsPage.filterByCategory(category);
      });

      const card: EventCard = await test.step(`Pick a ${category} card with at least 1 seat`, async () => {
        return eventsPage.findEventCard({ category, minSeats: 1 });
      });

      const cardData = {
        title: await card.title.innerText(),
        price: await card.priceValue(),
      };

      await test.step('Click Book Now: details page is the same event (title, category, price)', async () => {
        await card.bookNow();
        await expect(page).toHaveURL(/\/events\/\d+$/);
        await detailsPage.waitForLoaded();
        await expect(detailsPage.title).toHaveText(cardData.title);
        await expect(detailsPage.categoryBadge).toHaveText(category);
        expect(await detailsPage.pricePerTicketValue()).toBe(cardData.price);
        expect(await detailsPage.formPriceValue()).toBe(cardData.price);
      });

      await bookTickets(detailsPage, {
        quantity: 1,
        customer: buildCustomer(),
        expectedPrice: cardData.price,
        onBooked: (ref) => bookings.track(ref),
      });
    });
  }
});
