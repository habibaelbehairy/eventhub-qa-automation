import { defineSelectors } from '../../utils/selectorDefinition';

export default defineSelectors({
  selector: 'main',
  props: {
    path: '/bookings',
  },
  elements: {
    heading: 'role=heading[name="My Bookings"s][level=1]',
    bookingCards: '[data-testid="booking-card"]',
    bookingCardByRef: '[data-testid="booking-card"]:has(.booking-ref:text-is("{ref}"))',
    // Deletes ALL of the user's bookings.
    clearAllBookingsButton: 'role=button[name="Clear all bookings"s]',
    emptyStateHeading: 'role=heading[name="No bookings yet"s]',
    browseEventsButton: 'role=button[name="Browse Events"s]',
  },
});
