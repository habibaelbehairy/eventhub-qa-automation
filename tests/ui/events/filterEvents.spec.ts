import { test, expect } from '../../../fixtures';

/**
 * Events page — search and filters (read-only: nothing is booked or created).
 * The assertions do not depend on which events exist: every shown card must match the filter,
 * or the "No events found" empty state must be shown when nothing matches.
 */
test.describe('Filter events on the Events page', { tag: ['@ui', '@events'] }, () => {
  test.beforeEach(async ({ eventsPage }) => {
    // Plain /events URL = no filters or search.
    await eventsPage.open();
  });

  // ------------------------------------------------------------------ Category
  for (const category of ['Conference', 'Concert', 'Sports', 'Workshop', 'Festival']) {
    test(`category filter "${category}" shows only ${category} events`, async ({ eventsPage }) => {
      await eventsPage.filterByCategory(category);
      await eventsPage.assertEveryCardOrEmptyState(`${category} events`, async (card) => {
        await expect(card.categoryBadge, `card "${await card.title.innerText()}"`).toHaveText(category);
      });
    });
  }

  // ------------------------------------------------------------------ City
  for (const city of ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune']) {
    test(`city filter "${city}" shows only events in ${city}`, async ({ eventsPage }) => {
      await eventsPage.filterByCity(city);
      await eventsPage.assertEveryCardOrEmptyState(`events in ${city}`, async (card) => {
        expect(await card.cityText(), `card "${await card.title.innerText()}"`).toBe(city);
      });
    });
  }

  // ------------------------------------------------------------------ Combined
  for (const [category, city] of [
    ['Festival', 'Delhi'],
    ['Concert', 'Delhi'],
  ] as const) {
    test(`category "${category}" + city "${city}" shows only events matching both`, async ({ eventsPage }) => {
      await eventsPage.filterByCategory(category);
      await eventsPage.filterByCity(city);
      await eventsPage.assertEveryCardOrEmptyState(`${category} events in ${city}`, async (card) => {
        const title = await card.title.innerText();
        await expect(card.categoryBadge, `card "${title}"`).toHaveText(category);
        expect(await card.cityText(), `card "${title}"`).toBe(city);
      });
    });
  }

  // ------------------------------------------------------------------ Search
  test('searching for an event title shows that event', async ({ eventsPage }) => {
    const [firstCard] = await eventsPage.allEventCards();
    expect(firstCard, 'at least one event is listed').toBeDefined();
    const title = await firstCard.title.innerText();

    await eventsPage.search(title);

    await expect(eventsPage.eventCard(title).root).toBeVisible();
  });

  test('searching for text that matches nothing shows the empty state', async ({ eventsPage }) => {
    await eventsPage.search(`no-such-event-${Date.now()}`);

    await expect(eventsPage.eventCards).toHaveCount(0);
    await expect(eventsPage.noEventsMessage).toBeVisible();
  });

  // ------------------------------------------------------------------ Reset
  test('"Clear filters" on the empty state brings back all events', async ({ eventsPage }) => {
    await eventsPage.waitForResults();
    const allTitles = await eventsPage.eventCards.locator('h3').allInnerTexts();
    expect(allTitles.length, 'events are listed before filtering').toBeGreaterThan(0);

    await eventsPage.search(`no-such-event-${Date.now()}`);
    await expect(eventsPage.noEventsMessage).toBeVisible();
    await eventsPage.clearFilters();

    await expect(eventsPage.eventCards.locator('h3')).toHaveText(allTitles);
    await expect(eventsPage.categoryFilter).toHaveValue('');
    await expect(eventsPage.cityFilter).toHaveValue('');
    await expect(eventsPage.searchInput).toHaveValue('');
  });
});
