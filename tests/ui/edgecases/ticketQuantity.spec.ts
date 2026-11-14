import { test, expect, cleanUpTestData } from '../../../fixtures';
import { openEventFromHome } from '../../../common_steps/openEventFromHome';

/**
 * Edge cases — ticket quantity limits (UI only).
 * Covers over-booking at the UI level: the selector never lets you pick more tickets than are left.
 * No booking is made: Confirm Booking is never clicked, so no seats are taken on the shared events.
 */
test.describe('Ticket quantity edge cases', { tag: ['@ui', '@edge'] }, () => {
  test.afterAll(({ fileSession }) => cleanUpTestData(fileSession));

  test('quantity starts at 1, cannot go below 1 and stops at the 10-ticket maximum', async ({ page, eventDetailsPage: detailsPage }) => {
    const max = detailsPage.props.maxTicketsPerBooking;
    await openEventFromHome(page, { minSeats: max });

    await test.step('Default quantity is 1 and − is disabled', async () => {
      expect(await detailsPage.quantityValue()).toBe(1);
      await expect(detailsPage.decreaseButton).toBeDisabled();
    });

    await test.step(`Hint shows "(max ${max})"`, async () => {
      await expect(detailsPage.maxTicketsHint).toHaveText(`(max ${max})`);
    });

    await test.step(`+ goes up to ${max} and no further`, async () => {
      await detailsPage.setQuantity(max);
      await detailsPage.tryIncrease();
      expect(await detailsPage.quantityValue()).toBe(max);
    });

    await test.step('− works again from the maximum', async () => {
      await expect(detailsPage.decreaseButton).toBeEnabled();
      await detailsPage.decreaseButton.click();
      expect(await detailsPage.quantityValue()).toBe(max - 1);
    });
  });

  test('the order total updates as the quantity changes', async ({ page, eventDetailsPage: detailsPage }) => {
    await openEventFromHome(page, { minSeats: 4 });
    const price = await detailsPage.pricePerTicketValue();

    for (const quantity of [1, 4, 2]) {
      await detailsPage.setQuantity(quantity);
      expect(await detailsPage.totalValue(), `total for ${quantity} ticket(s)`).toBeCloseTo(price * quantity, 2);
    }
  });

  test('when fewer than 10 seats are left, the maximum is the number of seats left', async ({ page, eventDetailsPage: detailsPage }) => {
    const max = detailsPage.props.maxTicketsPerBooking;
    // Depends on live data (e.g. World Tech Summit has had 8 seats left): skip if no such event exists.
    const event = await openEventFromHome(page, { minSeats: 1, maxSeats: max - 1 }).catch(() => undefined);
    test.skip(!event, `No event with 1-${max - 1} seats left on the Home screen right now`);
    if (!event) return;
    const seatsLeft = await detailsPage.availableSeatsValue();

    await test.step(`Hint shows "(max ${seatsLeft})" instead of "(max ${max})"`, async () => {
      expect(seatsLeft, 'seats on details page vs card').toBe(event.seats);
      await expect(detailsPage.maxTicketsHint).toHaveText(`(max ${seatsLeft})`);
    });

    await test.step(`+ stops at ${seatsLeft}`, async () => {
      await detailsPage.setQuantity(seatsLeft);
      await detailsPage.tryIncrease();
      expect(await detailsPage.quantityValue()).toBe(seatsLeft);
    });

    await test.step(`+ is disabled at ${seatsLeft}`, async () => {
      await expect(detailsPage.increaseButton).toBeDisabled();
    });
  });
});
