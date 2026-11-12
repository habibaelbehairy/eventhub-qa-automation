import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { Role, UserRole, getUser, isSessionFresh, storageStatePath } from '../auth/users';
import { LoginPage } from '../page_objects/LoginPage';

export interface AuthFixtures {
  /**
   * Who the test runs as. Default: 'primaryUser'.
   * Change it for a file or a describe block with test.use({ role: 'secondaryUser' }),
   * or test.use({ role: 'anonymous' }) for a visitor who is not logged in.
   */
  role: Role;
}

/**
 * Authorization is handled here, not in the tests:
 *  - one browser window per spec file and role; tests in the file reuse it;
 *  - the window starts with the saved session of its role (.auth/<role>.json, valid for a limited
 *    time) or logs in once and saves it;
 *  - if a saved session is rejected by the site, the framework logs in again by itself;
 *  - before every test the window is reset: extra tabs are closed and the home page is opened.
 */
async function logIn(context: BrowserContext, page: Page, role: UserRole): Promise<void> {
  const user = getUser(role);
  const loginPage = new LoginPage(page);
  await context.clearCookies();
  await loginPage.open();
  await loginPage.signIn(user.email, user.password);
  await expect(loginPage.logoutButton).toBeVisible();
  await context.storageState({ path: storageStatePath(role) });
}

interface FileSession {
  key?: string;
  context?: BrowserContext;
  page?: Page;
}

export const authTest = base.extend<AuthFixtures, { fileSession: FileSession }>({
  role: ['primaryUser', { option: true }],

  // One browser window per spec file (and role): tests in the same file reuse it.
  fileSession: [
    async ({}, use) => {
      const session: FileSession = {};
      await use(session);
      await session.context?.close();
    },
    { scope: 'worker' },
  ],

  page: async ({ browser, baseURL, viewport, fileSession, role }, use, testInfo) => {
    const key = `${testInfo.file}::${role}`;
    let justLoggedIn = false;
    if (fileSession.key !== key || !fileSession.page || fileSession.page.isClosed()) {
      await fileSession.context?.close();
      const reuseSession = role !== 'anonymous' && isSessionFresh(role);
      fileSession.context = await browser.newContext({
        baseURL,
        viewport,
        storageState: reuseSession ? storageStatePath(role) : undefined,
      });
      fileSession.page = await fileSession.context.newPage();
      fileSession.key = key;

      // No fresh saved session: log in once in this same window and save it for later files/runs.
      if (role !== 'anonymous' && !reuseSession) {
        await logIn(fileSession.context, fileSession.page, role);
        justLoggedIn = true;
      }
    }
    const { context, page } = fileSession as Required<FileSession>;

    // Reset between tests: close tabs a previous test may have left open.
    for (const other of context.pages()) {
      if (other !== page) await other.close();
    }

    // Right after a fresh login the page is already logged in on the home screen: no reload needed.
    if (!justLoggedIn) await page.goto('/');

    if (role !== 'anonymous') {
      const loginPage = new LoginPage(page);
      const signedIn = await loginPage.logoutButton.waitFor({ state: 'visible', timeout: 5_000 }).then(
        () => true,
        () => false,
      );
      // The saved session was rejected (e.g. expired on the server): log in again and save the new one.
      if (!signedIn && !justLoggedIn) await logIn(context, page, role);
      await expect(
        loginPage.logoutButton,
        `"${role}" could not be logged in with the credentials in data/testcredentials.json.`,
      ).toBeVisible();
    }
    await use(page);
  },
});
