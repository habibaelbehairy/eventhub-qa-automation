import { test } from '@playwright/test';
import type { EventsPage } from '../page_objects/EventsPage';
import type { EventDetailsPage } from '../page_objects/EventDetailsPage';

/** Finds an event on the Events page by its (unique) title and opens its details page with "Book Now". */
export async function openEventByTitle(
  eventsPage: EventsPage,
  detailsPage: EventDetailsPage,
  title: string,
): Promise<void> {
  await test.step(`Open "${title}" from the Events page`, async () => {
    await eventsPage.open();
    await eventsPage.search(title);
    await eventsPage.eventCard(title).bookNow();
    await detailsPage.waitForLoaded();
  });
}
