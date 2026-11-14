import { test, expect } from '../../../../fixtures';
import { buildEvent } from '../../../../utils/testData';

/** Admin > Manage Events: creating an event and the form validation. */
test.describe('Create an event', { tag: ['@ui', '@admin'] }, () => {

  test('a new event appears in the Manage Events table and on the Events page', async ({
    adminEventsPage,
    eventsPage,
    events,
  }) => {
    const event = buildEvent();
    events.track(event.title);


    await test.step('Fill the form and add the event', async () => {
      await adminEventsPage.open();
      await adminEventsPage.createEvent(event);
    });

    await test.step('The table row shows what was entered', async () => {
      await adminEventsPage.expectRow(event);
    });

    await test.step('The event is listed on the Events page', async () => {
      await eventsPage.open();
      await eventsPage.search(event.title);
      const card = eventsPage.eventCard(event.title);
      await expect(card.root).toBeVisible();
      expect(await card.categoryText()).toBe(event.category);
      expect(await card.cityText()).toBe(event.city);
      expect(await card.seatsValue()).toBe(event.totalSeats);
    });
  });

});
