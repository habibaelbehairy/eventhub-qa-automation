import { test as base } from '@playwright/test';
import type { Role} from '../auth/users';
import { USER_ROLES, roleForWorker } from '../auth/users';
import { EventHubApi } from '../api/EventHubApi';
import { newApiContext } from '../api/apiSession';
import {
  BookingTracker,
  EventTracker,
  deleteTrackedBookings,
  deleteTrackedEvents,
} from './cleanup.fixture';

/**
 * The `test` the API specs import:  import { test, expect } from '../../fixtures/apiOnly';
 *
 * Unlike the UI `test`, this one never opens a browser. Authorization is still handled by the
 * framework: the `api` client logs its role in once through POST /auth/login (reusing the token the
 * UI saved if it is still fresh). Every booking / event a test creates is tracked and deleted after
 * the test, so the shared environment stays clean without any afterEach in the specs.
 */
export interface ApiOnlyFixtures {
  /** Who the test runs as. Default: the account of the worker; change with test.use({ role: '...' }). */
  role: Role;
  /** EventHub API client authorised as `role`. */
  api: EventHubApi;
  /** EventHub API client authorised as a DIFFERENT account than `role` (for cross-user / security tests). */
  otherApi: EventHubApi;
  /** Track bookings (by reference) to have them deleted after the test. */
  bookings: BookingTracker;
  /** Track events (by title) to have them deleted after the test. */
  events: EventTracker;
}

export const test = base.extend<ApiOnlyFixtures>({
  role: [async ({}, use, testInfo) => use(roleForWorker(testInfo.parallelIndex)), { option: true }],

  api: async ({ role }, use) => {
    if (role === 'anonymous') throw new Error('The "api" fixture needs a logged-in role, not "anonymous".');
    const context = await newApiContext(role);
    await use(new EventHubApi(context));
    await context.dispose();
  },

  otherApi: async ({ role }, use) => {
    const other = USER_ROLES.find((r) => r !== role);
    if (!other) throw new Error('The "otherApi" fixture needs at least two accounts in data/testcredentials.json.');
    const context = await newApiContext(other);
    await use(new EventHubApi(context));
    await context.dispose();
  },

  bookings: async ({ role }, use) => {
    const tracker = new BookingTracker();
    await use(tracker);
    await deleteTrackedBookings(role, tracker);
  },

  events: async ({ role }, use) => {
    const tracker = new EventTracker();
    await use(tracker);
    await deleteTrackedEvents(role, tracker);
  },
});

export { expect } from '@playwright/test';
