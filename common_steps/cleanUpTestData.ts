import type { Page } from '@playwright/test';
import { MyBookingsPage } from '../page_objects/MyBookingsPage';
import { AdminEventsPage } from '../page_objects/admin/AdminEventsPage';

/**
 * End-of-file cleanup through the UI (no API): clears all bookings on My Bookings. For files under
 * the admin folder it also deletes every event the account created on Admin > Manage Events
 * (demo events are read-only); other files never create own events, so that step is skipped.
 * It reuses the browser window (and login) of the spec file, so no extra window is opened:
 *   test.afterAll(({ fileSession }) => cleanUpTestData(fileSession));
 * A cleanup problem is a warning and never fails a test.
 */
export async function cleanUpTestData(session: { page?: Page; key?: string }): Promise<void> {
  const { page, key } = session;
  if (!page || page.isClosed()) return; // no test of this file opened a window, so nothing was created
  try {
    const myBookingsPage = new MyBookingsPage(page);
    await myBookingsPage.open();
    await myBookingsPage.clearAllBookingsIfAny();

    // Only admin tests create own events, so only they need the Manage Events cleanup.
    const isAdminFile = /[\\/]admin[\\/]/.test(key ?? '');
    if (!isAdminFile) {
      console.log('Cleanup: bookings cleared');
      return;
    }

    const adminEventsPage = new AdminEventsPage(page);
    await adminEventsPage.open();
    await adminEventsPage.waitForLoaded();
    const events = await adminEventsPage.deleteAllOwnEvents();
    console.log(`Cleanup: bookings cleared, ${events} event(s) deleted`);
  } catch (error) {
    console.warn(`Cleanup failed: ${error instanceof Error ? error.message : error}`);
  }
}