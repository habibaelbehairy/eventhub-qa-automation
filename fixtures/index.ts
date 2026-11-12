import { mergeTests } from '@playwright/test';
import { cleanupTest } from './cleanup.fixture';
import { pagesTest } from './pages.fixture';

/**
 * The `test` every spec imports:  import { test, expect } from '../../../fixtures';
 *
 * It gives each test:
 *  - a page that is ALREADY LOGGED IN as `role` (default 'primaryUser') — no login code in specs;
 *  - page objects (homePage, eventDetailsPage, myBookingsPage, ...);
 *  - `api`, an API client for the same user;
 *  - `bookings` and `events`, which delete every tracked booking / event after the test.
 *
 * Adding a capability = write a new *.fixture.ts and merge it here.
 */
export const test = mergeTests(cleanupTest, pagesTest);
export { expect } from '@playwright/test';
export type { Role, UserRole } from '../auth/users';
export { BookingTracker, EventTracker } from './cleanup.fixture';
export { cleanUpTestData } from '../common_steps/cleanUpTestData';
