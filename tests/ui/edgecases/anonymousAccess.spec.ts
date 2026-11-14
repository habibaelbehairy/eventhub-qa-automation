import { test, expect } from '../../../fixtures';

/**
 * UI — a visitor who is not logged in cannot reach the booking pages and is sent to the login page.
 * Read-only: nothing is created.
 */
test.describe('Anonymous visitor', { tag: ['@ui', '@booking', '@security'] }, () => {
  test.use({ role: 'anonymous' });

  test('is redirected to the login page when opening My Bookings', async ({ page, myBookingsPage, loginPage }) => {
    await page.goto('/bookings');

    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
    await expect(myBookingsPage.heading).toBeHidden();
  });

  test('is redirected to the login page when opening an event page', async ({ page, loginPage }) => {
    await page.goto('/events/1');

    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });
});
