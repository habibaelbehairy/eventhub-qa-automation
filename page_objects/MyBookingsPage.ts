import type { Page, Locator} from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { BookingCard } from './components/BookingCard';
import { CancelBookingDialog } from './components/CancelBookingDialog';
import S from '../data/selectorAlias/MyBookingsPage';
import type { BoundSection } from '../utils/selectorDefinition';
import { bindSelectors } from '../utils/selectorDefinition';

/** "My Bookings" page "/bookings" — the logged-in user's bookings. */
export class MyBookingsPage extends BasePage {
  protected readonly path = S.props.path;
  private readonly ui: BoundSection<typeof S>;
  readonly heading: Locator;
  readonly bookingCards: Locator;
  /** Deletes ALL of the user's bookings — use with care. */
  readonly clearAllBookingsButton: Locator;
  readonly emptyStateHeading: Locator;
  readonly browseEventsButton: Locator;
  readonly cancelDialog: CancelBookingDialog;

  constructor(page: Page) {
    super(page);
    this.ui = bindSelectors(page, S);
    const { elements } = this.ui;
    this.heading = elements.heading;
    this.bookingCards = elements.bookingCards;
    this.clearAllBookingsButton = elements.clearAllBookingsButton;
    this.emptyStateHeading = elements.emptyStateHeading;
    this.browseEventsButton = elements.browseEventsButton;
    this.cancelDialog = new CancelBookingDialog(page);
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  /** The card for a given booking reference, e.g. 'C-AB12CD'. */
  bookingCard(bookingRef: string): BookingCard {
    return new BookingCard(this.ui.element('bookingCardByRef', { ref: bookingRef }));
  }

  /** All booking cards for an event title (e.g. to check that only one booking was created). */
  bookingCardsForEvent(eventTitle: string): Locator {
    return this.ui.element('bookingCardsByEventTitle', { title: eventTitle });
  }

  /** Cancels every booking shown for an event title, one by one through the UI. */
  async cancelAllBookingsForEvent(eventTitle: string): Promise<void> {
    const cards = this.bookingCardsForEvent(eventTitle);
    const total = await cards.count();
    const cancelNext = async (remaining: number): Promise<void> => {
      if (remaining <= 0) return;
      await new BookingCard(cards.first()).clickCancel();
      await this.cancelDialog.confirm();
      await expect(this.cancelDialog.root).toBeHidden();
      await expect(cards).toHaveCount(remaining - 1);
      await cancelNext(remaining - 1);
    };

    await cancelNext(total);
  }

  /** Cancels a booking: Cancel Booking -> "Yes, cancel it". */
  async cancelBooking(bookingRef: string): Promise<void> {
    await this.bookingCard(bookingRef).clickCancel();
    await this.cancelDialog.confirm();
    await expect(this.cancelDialog.root).toBeHidden();
  }

  /** Cleanup helper: cancels the booking only if its card is still listed. */
  async cancelBookingIfPresent(bookingRef: string): Promise<void> {
    if ((await this.bookingCard(bookingRef).root.count()) > 0) {
      await this.cancelBooking(bookingRef);
      await expect(this.bookingCard(bookingRef).root).toHaveCount(0);
    }
  }

  /** Cleanup helper: clears every booking of the account, or does nothing when there are none. */
  async clearAllBookingsIfAny(): Promise<void> {
    await this.waitForLoaded();
    await expect(this.clearAllBookingsButton.or(this.emptyStateHeading).first()).toBeVisible();
    if (await this.clearAllBookingsButton.isVisible()) await this.clearAllBookings();
  }

  /**
   * Clicks "Clear all bookings" and confirms it.
   * The confirmation style has not been observed yet, so both are handled:
   * a native browser confirm() is accepted, and an in-page modal is confirmed if one appears.
   */
  async clearAllBookings(): Promise<void> {
    const acceptNativeConfirm = (dialog: import('@playwright/test').Dialog) => dialog.accept();
    this.page.once('dialog', acceptNativeConfirm);
    try {
      await this.clearAllBookingsButton.click();
      const modalConfirm = this.ui.sections.clearAllDialog.elements.confirmButton;
      // Either the list empties by itself (no modal / native confirm) or a modal asks to confirm.
      await expect(modalConfirm.or(this.emptyStateHeading).first()).toBeVisible();
      if (await modalConfirm.isVisible()) await modalConfirm.click();
      await expect(this.emptyStateHeading).toBeVisible();
    } finally {
      this.page.off('dialog', acceptNativeConfirm);
    }
  }
}
