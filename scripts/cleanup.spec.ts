import { test } from '@playwright/test';
import { USER_ROLES } from '../auth/users';
import { newApiContext } from '../api/apiSession';
import { EventHubApi } from '../api/EventHubApi';

/**
 * Deletes ALL test data of every test account on the shared environment:
 * every booking and every event the account created (the site's demo events are never touched).
 * Run with: npm run cleanup
 */
for (const role of USER_ROLES) {
  test(`clean up test data of ${role}`, async () => {
    const context = await newApiContext(role);
    try {
      const removed = await new EventHubApi(context).cleanupAccount();
      console.log(`${role}: deleted ${removed.bookings} booking(s) and ${removed.events} event(s)`);
    } finally {
      await context.dispose();
    }
  });
}
