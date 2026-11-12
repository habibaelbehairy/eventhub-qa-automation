import { Locator } from '@playwright/test';
import S from '../../data/selectorAlias/components/BookingCard';
import { bindSelectors } from '../../utils/selectorDefinition';
import { parseMoney, parseIntFrom } from '../../utils/parse';

/** One booking (data-testid="booking-card") on the My Bookings page. */
export class BookingCard {
  readonly root: Locator;
  readonly bookingRef: Locator;
  /** "confirmed" / "cancelled" badge */
  readonly status: Locator;
  /** "#54761" */
  readonly bookingId: Locator;
  readonly eventTitle: Locator;
  /** "🎫 2 tickets" */
  readonly tickets: Locator;
  readonly total: Locator;
  readonly viewDetailsButton: Locator;
  readonly cancelButton: Locator;

  constructor(root: Locator) {
    const { elements } = bindSelectors(root, S);
    this.root = root;
    this.bookingRef = elements.bookingRef;
    this.status = elements.status;
    this.bookingId = elements.bookingId;
    this.eventTitle = elements.eventTitle;
    this.tickets = elements.tickets;
    this.total = elements.total;
    this.viewDetailsButton = elements.viewDetailsButton;
    this.cancelButton = elements.cancelButton;
  }

  async ticketsValue(): Promise<number> {
    return parseIntFrom(await this.tickets.innerText());
  }

  async totalValue(): Promise<number> {
    return parseMoney(await this.total.innerText());
  }

  async bookingIdValue(): Promise<number> {
    return parseIntFrom(await this.bookingId.innerText());
  }

  async viewDetails(): Promise<void> {
    await this.viewDetailsButton.click();
  }

  /** Opens the cancel confirmation dialog (it does not cancel yet). */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
