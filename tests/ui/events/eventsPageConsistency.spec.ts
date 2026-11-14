import { test, expect } from '../../../fixtures';

/**
 * UI — consistency of the Events page: the demo data and the filters must agree with each other.
 * Read-only: nothing is created.
 */
test.describe('Events page consistency', { tag: ['@ui', '@events', '@xfail'] }, () => {
  // Observed: the demo concert is listed in "Los Angeles", a city that is not in the city filter,
  // so that event cannot be found by city. We don't know if this is intended; marked as test.fail (xfail).
  test('every featured event is in a city that the city filter offers', async ({ eventsPage }) => {
    test.fail(true, 'A demo event has a city that is not a filter option; unclear if intended');
    await eventsPage.open();
    await eventsPage.waitForLoaded();

    const offenders: string[] = [];
    for (const card of await eventsPage.allEventCards()) {
      if (!(await card.featuredBadge.isVisible())) continue;
      const city = await card.cityText();
      if (!(eventsPage.props.cities as readonly string[]).includes(city)) offenders.push(`${(await card.title.innerText()).trim()} (${city})`);
    }

    expect(offenders, 'featured events whose city is not a filter option').toEqual([]);
  });
});
