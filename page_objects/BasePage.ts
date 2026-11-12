import { Page } from '@playwright/test';
import { NavBar } from './components/NavBar';
import { PageMessages } from './components/PageMessages';

/**
 * Parent class for all page objects.
 * Gives every page the browser tab (page), the shared navigation bar (nav), page-wide
 * messages (errors/toasts) and an open() method that navigates to the page and waits until it is ready.
 */
export abstract class BasePage {
  readonly page: Page;
  readonly nav: NavBar;
  readonly messages: PageMessages;

  /** Relative URL of the page, for example '/bookings'. */
  protected abstract path: string;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavBar(page);
    this.messages = new PageMessages(page);
  }

  /** Navigates to this page and waits until it has loaded. */
  async open(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForLoaded();
  }

  /** Each page defines what "loaded" means, usually its main heading being visible. */
  abstract waitForLoaded(): Promise<void>;
}
