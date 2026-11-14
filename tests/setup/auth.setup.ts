import { test as setup } from '@playwright/test';
import { USER_ROLES } from '../../auth/users';
import { newApiContext } from '../../api/apiSession';

/**
 * Runs once before the ui and api projects: logs every role in and saves its session (.auth/<role>.json),
 * so no test pays for the first login. The auth fixture still logs in again if a session is rejected later.
 */
for (const role of USER_ROLES) {
  setup(`log in ${role}`, async () => {
    const context = await newApiContext(role);
    await context.dispose();
  });
}
