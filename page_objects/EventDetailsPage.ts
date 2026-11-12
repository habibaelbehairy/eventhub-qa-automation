import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import S from '../data/selectorAlias/EventDetailsPage';
import { bindSelectors, BoundSection } from '../utils/selectorDefinition';
import { withParams } from '../utils/selectors';
import { parseMoney, parseIntFrom } from '../utils/parse';

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

/** Event details "/events/{id}" — event info, the booking form and the booking confirmation. */
export class EventDetailsPage extends BasePage {
  protected path: string = S.props.path;
  private readonly ui: BoundSection<typeof S>;
  /** Static data from the selector definition (validation messages, max tickets). */
  readonly props = S.props;
  readonly title: Locator;
  readonly categoryBadge: Locator;
  readonly featuredBadge: Locator;
  /** "This is a featured event — always available for practice" */
  readonly featuredBanner: Locator;
  /** "Saturday, 11 July" */
  readonly date: Locator;
  /** "10:00 pm" (in the browser's time zone) */
  readonly time: Locator;
  readonly venue: Locator;
  readonly city: Locator;
  /** "2287 / 3000 seats" */
  readonly availableSeats: Locator;
  readonly pricePerTicket: Locator;

  // Booking form section
  readonly bookTicketsHeading: Locator;
  /** Price shown in the booking panel next to "Book Tickets". */
  readonly formPrice: Locator;
  readonly decreaseButton: Locator;
  readonly increaseButton: Locator;
  readonly quantity: Locator;
  readonly maxTicketsHint: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  /** "$250 × 2 tickets" line of the order summary */
  readonly summaryLine: Locator;
  readonly total: Locator;
  readonly confirmBookingButton: Locator;

  // Confirmation section (replaces the form after a successful booking)
  readonly confirmationHeading: Locator;
  readonly confirmationBookingRef: Locator;
  readonly viewMyBookingsButton: Locator;
  readonly browseMoreEventsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.ui = bindSelectors(page, S);
    const form = this.ui.sections.bookingForm;
    const confirmation = form.sections.confirmation;

    this.title = this.ui.elements.title;
    this.categoryBadge = this.ui.elements.categoryBadge;
    this.featuredBadge = this.ui.elements.featuredBadge;
    this.featuredBanner = this.ui.elements.featuredBanner;
    this.date = this.infoValue('Date');
    this.time = this.infoValue('Time');
    this.venue = this.infoValue('Venue');
    this.city = this.infoValue('City');
    this.availableSeats = this.infoValue('Available');
    this.pricePerTicket = this.infoValue('Price per ticket');

    this.bookTicketsHeading = form.elements.heading;
    this.formPrice = form.elements.price;
    this.decreaseButton = form.elements.decreaseButton;
    this.increaseButton = form.elements.increaseButton;
    this.quantity = form.elements.quantity;
    this.maxTicketsHint = form.elements.maxTicketsHint;
    this.nameInput = form.elements.nameInput;
    this.emailInput = form.elements.emailInput;
    this.phoneInput = form.elements.phoneInput;
    this.summaryLine = form.elements.summaryLine;
    this.total = form.elements.total;
    this.confirmBookingButton = form.elements.confirmBookingButton;

    this.confirmationHeading = confirmation.elements.heading;
    this.confirmationBookingRef = confirmation.elements.bookingRef;
    this.viewMyBookingsButton = confirmation.elements.viewMyBookingsButton;
    this.browseMoreEventsButton = confirmation.elements.browseMoreEventsButton;
  }

  /** Opens the details page of a specific event. */
  async openEvent(eventId: number): Promise<void> {
    this.path = withParams(S.props.path, { id: eventId });
    await this.open();
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.bookTicketsHeading).toBeVisible();
  }

  // ---- booking form -------------------------------------------------------

  async quantityValue(): Promise<number> {
    return parseIntFrom(await this.quantity.innerText());
  }

  /** Clicks + / − until the requested quantity is shown. */
  async setQuantity(target: number): Promise<void> {
    let current = await this.quantityValue();
    while (current !== target) {
      await (current < target ? this.increaseButton : this.decreaseButton).click();
      const next = await this.quantityValue();
      if (next === current) throw new Error(`Quantity stuck at ${current}, cannot reach ${target}`);
      current = next;
    }
  }

  async fillCustomerDetails(customer: CustomerDetails): Promise<void> {
    await this.nameInput.fill(customer.name);
    await this.emailInput.fill(customer.email);
    await this.phoneInput.fill(customer.phone);
  }

  async confirmBooking(): Promise<void> {
    await this.confirmBookingButton.click();
  }

  /** Full booking: quantity + customer details + Confirm Booking. */
  async bookTickets(quantity: number, customer: CustomerDetails): Promise<void> {
    await this.setQuantity(quantity);
    await this.fillCustomerDetails(customer);
    await this.confirmBooking();
  }

  async totalValue(): Promise<number> {
    return parseMoney(await this.total.innerText());
  }

  async pricePerTicketValue(): Promise<number> {
    return parseMoney(await this.pricePerTicket.innerText());
  }

  async formPriceValue(): Promise<number> {
    return parseMoney(await this.formPrice.innerText());
  }

  /** First number of "2287 / 3000 seats". */
  async availableSeatsValue(): Promise<number> {
    return parseIntFrom(await this.availableSeats.innerText());
  }

  /** Validation message in the booking form, e.g. props.validationMessages.email */
  validationError(message: string): Locator {
    return this.ui.sections.bookingForm.element('validationError', { message });
  }

  // ---- confirmation -------------------------------------------------------

  /** Value next to a label in the confirmation box. */
  confirmationValue(label: 'Booking Ref' | 'Customer' | 'Tickets' | 'Total'): Locator {
    return this.ui.sections.bookingForm.sections.confirmation.element('valueByLabel', { label });
  }

  async confirmationBookingRefText(): Promise<string> {
    return (await this.confirmationBookingRef.innerText()).trim();
  }

  // ---- helpers ------------------------------------------------------------

  /** Event info tiles: a label ('Date', 'Venue', 'Available', ...) followed by its value. */
  infoValue(label: string): Locator {
    return this.ui.element('infoValue', { label });
  }
}
