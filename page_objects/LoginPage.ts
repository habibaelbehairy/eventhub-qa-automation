import { Page, Locator, expect } from '@playwright/test';
import S from '../data/selectorAlias/LoginPage';
import { bindSelectors } from '../utils/selectorDefinition';

/** Page object for https://eventhub.rahulshettyacademy.com/login */
export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const { elements } = bindSelectors(page, S);
    this.heading = elements.heading;
    this.emailInput = elements.emailInput;
    this.passwordInput = elements.passwordInput;
    this.signInButton = elements.signInButton;
    // Shown in the top navigation once the user is signed in.
    this.logoutButton = elements.logoutButton;
  }

  async open(): Promise<void> {
    await this.page.goto(S.props.path);
    await expect(this.heading).toBeVisible();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
