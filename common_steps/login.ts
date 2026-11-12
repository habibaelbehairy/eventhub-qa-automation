import { Page, expect } from '@playwright/test';
import { LoginPage } from '../page_objects/LoginPage';
import credentials from '../data/testcredentials.json';

export type UserRole = keyof typeof credentials; // 'primaryUser' | 'secondaryUser'

export function getUser(role: UserRole) {
  return credentials[role];
}

/**
 * Logs in through the UI as the given user (default: primaryUser)
 * and verifies the user is signed in.
 */
export async function login(page: Page, role: UserRole = 'primaryUser'): Promise<void> {
  const user = getUser(role);
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.signIn(user.email, user.password);

  await expect(loginPage.logoutButton).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
}
