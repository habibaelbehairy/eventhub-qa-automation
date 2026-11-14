import { test, expect } from '@playwright/test';
import type { EventDetailsPage, CustomerDetails } from '../page_objects/EventDetailsPage';
import { parseMoney, parseIntFrom } from '../utils/parse';

export interface BookTicketsOptions {
  quantity: number;
  customer: CustomerDetails;
  /** Ticket price the user saw before booking (e.g. on the event card). */
  expectedPrice: number;
  /**
   * Called with the booking reference as soon as the confirmation appears, BEFORE the
   * confirmation is checked. Use it to remember the booking for cleanup, so it is deleted
   * even if one of the confirmation checks fails.
   */
  onBooked: (bookingRef: string) => void;
}

/**
 * Common booking step on the event details page:
 * select quantity -> check summary and total -> fill name, email, phone -> Confirm Booking
 * -> check the confirmation (reference, customer, tickets, total).
 * Returns the booking reference.
 */
export async function bookTickets(detailsPage: EventDetailsPage, options: BookTicketsOptions): Promise<string> {
  const { quantity, customer, expectedPrice, onBooked } = options;
  const expectedTotal = expectedPrice * quantity;
  const ticketWord = quantity === 1 ? 'ticket' : 'tickets';

  await test.step(`Select ${quantity} ${ticketWord}: summary and total are price x ${quantity}`, async () => {
    await detailsPage.setQuantity(quantity);
    expect(await detailsPage.quantityValue()).toBe(quantity);
    await expect(detailsPage.summaryLine).toHaveText(new RegExp(`× ${quantity} ${ticketWord}$`));
    // "$2,500 × 2 tickets" -> price part is before the "×"
    const summaryPrice = (await detailsPage.summaryLine.innerText()).split('×')[0];
    expect(parseMoney(summaryPrice)).toBe(expectedPrice);
    expect(await detailsPage.totalValue()).toBe(expectedTotal);
  });

  await test.step('Fill name, email and phone', async () => {
    await detailsPage.fillCustomerDetails(customer);
    await expect(detailsPage.nameInput).toHaveValue(customer.name);
    await expect(detailsPage.emailInput).toHaveValue(customer.email);
    await expect(detailsPage.phoneInput).toHaveValue(customer.phone);
  });

  return test.step('Confirm booking: confirmation shows reference, customer, tickets and total', async () => {
    await detailsPage.confirmBooking();
    await expect(detailsPage.confirmationHeading).toBeVisible();

    const bookingRef = await detailsPage.confirmationBookingRefText();
    onBooked(bookingRef);

    expect(bookingRef).toMatch(/^.+-[A-Z0-9]{6}$/);
    await expect(detailsPage.confirmationValue('Customer')).toHaveText(customer.name);
    expect(parseIntFrom(await detailsPage.confirmationValue('Tickets').innerText())).toBe(quantity);
    expect(parseMoney(await detailsPage.confirmationValue('Total').innerText())).toBe(expectedTotal);
    await expect(detailsPage.viewMyBookingsButton).toBeVisible();
    return bookingRef;
  });
}
