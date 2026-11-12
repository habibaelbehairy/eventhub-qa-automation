import { defineSelectors } from '../../../utils/selectorDefinition';

// Root is the card itself (data-testid="booking-card"), given by My Bookings.
export default defineSelectors({
  elements: {
    bookingRef: '.booking-ref',
    status: 'text=/^(confirmed|cancelled)$/',
    bookingId: '[data-testid="booking-id"]',
    eventTitle: 'h3',
    tickets: 'text=/[0-9]+ tickets?$/',
    total: 'text="total" >> xpath=preceding-sibling::p[1]',
    viewDetailsButton: 'role=button[name="View Details"s]',
    cancelButton: '[data-testid="cancel-booking-btn"]',
  },
});
