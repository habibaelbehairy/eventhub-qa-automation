import { test as teardown } from '@playwright/test';
import { USER_ROLES } from '../../auth/users';
import { newApiContext } from '../../api/apiSession';
import { EventHubApi } from '../../api/EventHubApi';

/**
 * Safety net for data left by aborted or killed runs (the per-test trackers handle the normal case).
 * Only items older than the grace period are removed, so it never deletes the data of a run that is
 * still in progress with the same accounts on another machine or CI job.
 */
const GRACE_PERIOD_MS = 30 * 60 * 1000;

for (const role of USER_ROLES) {
  teardown(`sweep stale test data of ${role}`, async () => {
    const context = await newApiContext(role);
    try {
      const removed = await new EventHubApi(context).cleanupAccount(GRACE_PERIOD_MS);
      teardown.info().annotations.push({
        type: 'cleanup',
        description: `${role}: removed ${removed.bookings} stale booking(s) and ${removed.events} stale event(s)`,
      });
    } finally {
      await context.dispose();
    }
  });
}
