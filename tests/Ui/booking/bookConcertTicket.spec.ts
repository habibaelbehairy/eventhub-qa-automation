import { test, expect } from '@playwright/test';
import { launchBrowser, closeBrowser, BrowserSession } from '../../../common_steps/launchBrowser';
import { login } from '../../../common_steps/login';
import { createApiSession, deleteBookingByRef, API_BASE_URL } from '../../../common_steps/cleanupData';
import { HomePage } from '../../../page_objects/HomePage';
import { EventCard } from '../../../page_objects/components/EventCard';
import { EventDetailsPage } from '../../../page_objects/EventDetailsPage';
import { buildCustomer } from '../../../utils/testData';
import { parseMoney, parseIntFrom } from '../../../utils/parse';

/**
 * US-114 — Book tickets for an event (AC1, AC2)
 * Full flow on a featured concert: Home screen card -> Book Now -> event details -> booking form -> confirmation.
 * Featured events are the site's static demo events, so we book on a shared event and
 * cancel the booking afterwards (seats are restored).
 */
test.describe('Book concert tickets', { tag: ['@ui', '@booking'] }, () => {
  let session: BrowserSession;
  let bookingRef: string | undefined;

  test.beforeEach(async () => {
    session = await launchBrowser();
    await login(session.page, 'primaryUser');
  });

  test.afterEach(async () => {
    // Clean up the shared environment even if the test failed half-way.
    if (bookingRef) {
      const { api } = await createApiSession('primaryUser');
      await deleteBookingByRef(api, bookingRef);
      await api.dispose();
    }
    await closeBrowser(session);
  });

  test('book 1 ticket for a featured concert from the home screen', async () => {
    const page = session.page;
    const homePage = new HomePage(page);
    const detailsPage = new EventDetailsPage(page);
    const customer = buildCustomer();
    const quantity = 1;

    // ---------------------------------------------------------------- Home screen card
    await test.step('Go to the Home screen with all event cards', async () => {
      await homePage.nav.goToHome();
      await homePage.waitForLoaded();
      await expect(homePage.featuredEventsHeading).toBeVisible();
    });

    const card: EventCard = await test.step('Loop through the cards to find the featured concert', async () => {
      return homePage.findEventCard('Concert', { featured: true });
    });

    const cardData = await test.step('Card shows Concert badge, title, date, location, price and seats', async () => {
      await expect(card.root).toBeVisible();
      await expect(card.categoryBadge).toHaveText('Concert');
      await expect(card.title).not.toBeEmpty();
      await expect(card.date).toHaveText(/^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2}$/); // "Sat, 11 Jul"
      await expect(card.location).toHaveText(/^.+, .+$/); // "<venue>, <city>"
      await expect(card.price).toHaveText(/^\$[\d,]+(\.\d{2})?$/); // "$2,500"
      await expect(card.seats).toHaveText(/^\d+ seats (available|left!?)$/);
      await expect(card.bookNowLink).toBeVisible();

      return {
        title: await card.title.innerText(),
        date: await card.date.innerText(),
        location: await card.location.innerText(),
        price: await card.priceValue(),
        seats: await card.seatsValue(),
      };
    });

    // ---------------------------------------------------------------- Event details page
    await test.step('Click Book Now and the event details page loads', async () => {
      await card.bookNow();
      await expect(page).toHaveURL(/\/events\/\d+$/);
      await detailsPage.waitForLoaded();
    });

    await test.step('Details show the same title with Concert and Featured badges', async () => {
      await expect(detailsPage.title).toHaveText(cardData.title);
      await expect(detailsPage.categoryBadge).toHaveText('Concert');
      await expect(detailsPage.featuredBadge).toBeVisible();
      await expect(detailsPage.featuredBanner).toBeVisible();
    });

    await test.step('Date matches the card ("Sat, 11 Jul" -> "Saturday, 11 July")', async () => {
      const [weekday, dayMonth] = cardData.date.split(', '); // "Sat", "11 Jul"
      const [day, month] = dayMonth.split(' '); // "11", "Jul"
      await expect(detailsPage.date).toHaveText(new RegExp(`^${weekday}[a-z]*, ${day} ${month}[a-z]*$`));
    });

    await test.step('Time matches the event time from the API (shown in the browser time zone)', async () => {
      // The card has no time, so the API's eventDate is the reference.
      const eventId = Number(page.url().split('/').pop());
      const { api } = await createApiSession('primaryUser');
      const event = (await (await api.get(`${API_BASE_URL}/events/${eventId}`)).json()).data;
      await api.dispose();

      const [expectedHours, expectedMinutes] = await page.evaluate((iso: string) => {
        const d = new Date(iso);
        return [d.getHours(), d.getMinutes()];
      }, event.eventDate);

      const timeText = (await detailsPage.time.innerText()).trim(); // "10:00 pm"
      expect(timeText).toMatch(/^\d{1,2}:\d{2} (am|pm)$/i);
      const [, hh, mm, ampm] = timeText.match(/^(\d{1,2}):(\d{2}) (am|pm)$/i)!;
      const hours24 = (Number(hh) % 12) + (ampm.toLowerCase() === 'pm' ? 12 : 0);
      expect({ hours: hours24, minutes: Number(mm) }).toEqual({ hours: expectedHours, minutes: expectedMinutes });
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

    // ---------------------------------------------------------------- Booking form
    await test.step('Booking form shows card price, quantity 1 and empty fields', async () => {
      await expect(detailsPage.bookTicketsHeading).toBeVisible();
      expect(await detailsPage.formPriceValue()).toBe(cardData.price);
      expect(await detailsPage.quantityValue()).toBe(1);
      await expect(detailsPage.decreaseButton).toBeDisabled();
      await expect(detailsPage.nameInput).toBeEmpty();
      await expect(detailsPage.emailInput).toBeEmpty();
      await expect(detailsPage.phoneInput).toBeEmpty();
      expect(await detailsPage.totalValue()).toBe(cardData.price);
    });

    await test.step(`Book ${quantity} ticket: summary and total equal the card price`, async () => {
      await detailsPage.setQuantity(quantity); // default is already 1, so no click is needed
      await expect(detailsPage.summaryLine).toHaveText(new RegExp(`× ${quantity} ticket$`));
      // "$2,500 × 1 ticket" -> price part is before the "×"
      const summaryPrice = (await detailsPage.summaryLine.innerText()).split('×')[0];
      expect(parseMoney(summaryPrice)).toBe(cardData.price);
      expect(await detailsPage.totalValue()).toBe(cardData.price * quantity);
    });

    await test.step('Fill name, email and phone', async () => {
      await detailsPage.fillCustomerDetails(customer);
      await expect(detailsPage.nameInput).toHaveValue(customer.name);
      await expect(detailsPage.emailInput).toHaveValue(customer.email);
      await expect(detailsPage.phoneInput).toHaveValue(customer.phone);
    });

    // ---------------------------------------------------------------- Confirmation
    await test.step('Confirm booking shows a confirmation with booking reference and correct total', async () => {
      await detailsPage.confirmBooking();
      await expect(detailsPage.confirmationHeading).toBeVisible();

      bookingRef = await detailsPage.confirmationBookingRefText();
      expect(bookingRef).toMatch(/^.+-[A-Z0-9]{6}$/);

      await expect(detailsPage.confirmationValue('Customer')).toHaveText(customer.name);
      expect(parseIntFrom(await detailsPage.confirmationValue('Tickets').innerText())).toBe(quantity);
      expect(parseMoney(await detailsPage.confirmationValue('Total').innerText())).toBe(cardData.price * quantity);
      await expect(detailsPage.viewMyBookingsButton).toBeVisible();
    });
  });
});
