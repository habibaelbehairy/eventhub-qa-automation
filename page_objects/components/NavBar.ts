import { Page, Locator } from '@playwright/test';
import S from '../../data/selectorAlias/components/NavBar';
import { bindSelectors, BoundSection } from '../../utils/selectorDefinition';

/** Top navigation bar shown on every page once logged in. */
export class NavBar {
  private readonly ui: BoundSection<typeof S>;
  readonly root: Locator;
  readonly homeLink: Locator;
  readonly eventsLink: Locator;
  readonly myBookingsLink: Locator;
  readonly adminMenuButton: Locator;
  readonly manageEventsLink: Locator;
  readonly manageBookingsLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.ui = bindSelectors(page, S);
    const { elements } = this.ui;
    this.root = this.ui.root;
    this.homeLink = elements.homeLink;
    this.eventsLink = elements.eventsLink;
    this.myBookingsLink = elements.myBookingsLink;
    this.adminMenuButton = elements.adminMenuButton;
    this.manageEventsLink = elements.manageEventsLink;
    this.manageBookingsLink = elements.manageBookingsLink;
    this.logoutButton = elements.logoutButton;
  }

  /** The logged-in user's email shown next to Logout. */
  userEmail(email: string): Locator {
    return this.ui.element('userEmail', { email });
  }

  async goToHome(): Promise<void> {
    await this.homeLink.click();
  }

  async goToEvents(): Promise<void> {
    await this.eventsLink.click();
  }

  async goToMyBookings(): Promise<void> {
    await this.myBookingsLink.click();
  }

  async goToManageEvents(): Promise<void> {
    await this.adminMenuButton.click();
    await this.manageEventsLink.click();
  }

  async goToManageBookings(): Promise<void> {
    await this.adminMenuButton.click();
    await this.manageBookingsLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
