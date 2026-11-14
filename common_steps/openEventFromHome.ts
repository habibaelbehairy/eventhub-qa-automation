import type { Page} from '@playwright/test';
import { test, expect } from '@playwright/test';
import { HomePage } from '../page_objects/HomePage';
import { EventDetailsPage } from '../page_objects/EventDetailsPage';
import type { EventCardCriteria } from '../page_objects/components/EventCard';

export interface OpenedEvent {
  title: string;
  price: number;
  /** Available seats shown on the card. */
  seats: number;
}

/**
 * Common step: Home -> loop through the cards -> first card matching the criteria -> Book Now
 * -> event details page loaded. Returns what the card showed.
 */
export async function openEventFromHome(page: Page, criteria: EventCardCriteria = {}): Promise<OpenedEvent> {
  return test.step(`Open an event from the Home screen ${JSON.stringify(criteria)}`, async () => {
    const homePage = new HomePage(page);
    const detailsPage = new EventDetailsPage(page);

    await homePage.nav.goToHome();
    await homePage.waitForLoaded();
    const { category, ...options } = criteria;
    const card = await homePage.findEventCard(category, options);

    const event: OpenedEvent = {
      title: await card.title.innerText(),
      price: await card.priceValue(),
      seats: await card.seatsValue(),
    };

    await card.bookNow();
    await detailsPage.waitForLoaded();
    await expect(detailsPage.title).toHaveText(event.title);
    return event;
  });
}
