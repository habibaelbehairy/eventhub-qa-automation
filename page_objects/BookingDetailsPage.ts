import type { Page, Locator} from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CancelBookingDialog } from './components/CancelBookingDialog';
import S from '../data/selectorAlias/BookingDetailsPage';
import type { BoundSection } from '../utils/selectorDefinition';
import { bindSelectors } from '../utils/selectorDefinition';
import { withParams } from '../utils/selectors';
import { parseMoney } from '../utils/parse';

export type PaymentLabel = 'Tickets' | 'Price per ticket' | 'Total Paid';

/** Booking details "/bookings/{id}" — opened from "View Details" on My Bookings. */
export class BookingDetailsPage extends BasePage {
  protected path: string = S.props.path;
  private readonly ui: BoundSection<typeof S>;
  readonly eventTitle: Locator;
  readonly bookingRef: Locator;
  readonly status: Locator;
  readonly cancelBookingButton: Locator;
  readonly eventDetailsSection: Locator;
  readonly customerDetailsSection: Locator;
  readonly paymentSummarySection: Locator;
  readonly checkRefundButton: Locator;
  readonly backToMyBookingsButton: Locator;
  readonly cancelDialog: CancelBookingDialog;

  constructor(page: Page) {
    super(page);
    this.ui = bindSelectors(page, S);
    const { elements } = this.ui;
    this.eventTitle = elements.eventTitle;
    this.status = elements.status;
    this.bookingRef = elements.bookingRef;
    this.cancelBookingButton = elements.cancelBookingButton;
    this.eventDetailsSection = this.section('Event Details');
    this.customerDetailsSection = this.section('Customer Details');
    this.paymentSummarySection = this.section('Payment Summary');
    this.checkRefundButton = elements.checkRefundButton;
    this.backToMyBookingsButton = elements.backToMyBookingsButton;
    this.cancelDialog = new CancelBookingDialog(page);
  }

  async openBooking(bookingId: number): Promise<void> {
    this.path = withParams(S.props.path, { id: bookingId });
    await this.open();
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.paymentSummarySection).toBeVisible();
  }

  async cancelBooking(): Promise<void> {
    await this.cancelBookingButton.click();
    await this.cancelDialog.confirm();
    await expect(this.cancelDialog.root).toBeHidden();
  }

  /**
   * A number from the Payment Summary block, e.g. "Tickets 3 · Price per ticket $250 · Total Paid $750".
   * paymentValue('Total Paid') -> 750
   */
  async paymentValue(label: PaymentLabel): Promise<number> {
    const text = await this.paymentSummarySection.innerText();
    const match = new RegExp(String.raw`${label}\s*([$0-9.,]+)`).exec(text);
    if (!match) throw new Error(`"${label}" not found in Payment Summary: "${text}"`);
    return parseMoney(match[1]);
  }

  /** A block of the page identified by its h2 heading (contains label/value text). */
  private section(heading: string): Locator {
    return this.ui.element('sectionByHeading', { heading });
  }
}
