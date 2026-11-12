import { authTest } from './auth.fixture';
import { EventHubApi } from '../api/EventHubApi';
import { newApiContext } from '../api/apiSession';

export interface ApiFixtures {
  /** EventHub API client logged in as the same role as the browser page. */
  api: EventHubApi;
}

export const apiTest = authTest.extend<ApiFixtures>({
  // Depends on `page` so the framework has logged the role in (and saved the session) first.
  api: async ({ role, page: _page }, use) => {
    if (role === 'anonymous') throw new Error('The "api" fixture needs a logged-in role, not "anonymous".');
    const context = await newApiContext(role);
    await use(new EventHubApi(context));
    await context.dispose();
  },
});
