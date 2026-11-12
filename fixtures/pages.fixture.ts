import { test as base } from '@playwright/test';
import { LoginPage } from '../page_objects/LoginPage';
import { HomePage } from '../page_objects/HomePage';
import { EventsPage } from '../page_objects/EventsPage';
import { EventDetailsPage } from '../page_objects/EventDetailsPage';
import { MyBookingsPage } from '../page_objects/MyBookingsPage';
import { BookingDetailsPage } from '../page_objects/BookingDetailsPage';
import { AdminEventsPage } from '../page_objects/admin/AdminEventsPage';
import { AdminBookingsPage } from '../page_objects/admin/AdminBookingsPage';

/**
 * Page objects, ready to use in any test: async ({ homePage, myBookingsPage }) => { ... }.
 * They are created lazily (only the ones a test asks for) on the test's own page.
 * New page object? Add one line here and every spec can use it.
 */
export interface PageFixtures {
  loginPage: LoginPage;
  homePage: HomePage;
  eventsPage: EventsPage;
  eventDetailsPage: EventDetailsPage;
  myBookingsPage: MyBookingsPage;
  bookingDetailsPage: BookingDetailsPage;
  adminEventsPage: AdminEventsPage;
  adminBookingsPage: AdminBookingsPage;
}

export const pagesTest = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  eventsPage: async ({ page }, use) => use(new EventsPage(page)),
  eventDetailsPage: async ({ page }, use) => use(new EventDetailsPage(page)),
  myBookingsPage: async ({ page }, use) => use(new MyBookingsPage(page)),
  bookingDetailsPage: async ({ page }, use) => use(new BookingDetailsPage(page)),
  adminEventsPage: async ({ page }, use) => use(new AdminEventsPage(page)),
  adminBookingsPage: async ({ page }, use) => use(new AdminBookingsPage(page)),
});
