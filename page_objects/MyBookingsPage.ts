import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { BookingCard } from './components/BookingCard';
import { CancelBookingDialog } from './components/CancelBookingDialog';
import S from '../data/selectorAlias/MyBookingsPage';
import { bindSelectors, BoundSection } from '../utils/selectorDefinition';

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

  /** Cancels a booking: Cancel Booking -> "Yes, cancel it". */
  async cancelBooking(bookingRef: string): Promise<void> {
    await this.bookingCard(bookingRef).clickCancel();
    await this.cancelDialog.confirm();
    await expect(this.cancelDialog.root).toBeHidden();
  }
}
