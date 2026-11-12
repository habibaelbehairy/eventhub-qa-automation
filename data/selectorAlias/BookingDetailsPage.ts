import { defineSelectors } from '../../utils/selectorDefinition';

export default defineSelectors({
  selector: 'main',
  props: {
    path: '/bookings/{id}',
  },
  elements: {
    eventTitle: 'role=heading[level=1]',
    status: 'text=/^(confirmed|cancelled)$/ >> nth=0',
    // The reference is the badge right before the status badge (no .booking-ref class on this page).
    bookingRef: 'text=/^(confirmed|cancelled)$/ >> nth=0 >> xpath=preceding-sibling::*[1]',
    cancelBookingButton: 'role=button[name="Cancel Booking"s]',
    // Blocks with an h2 heading: 'Event Details' | 'Customer Details' | 'Payment Summary' | 'Refund' | 'Booking Information'
    sectionByHeading: 'role=heading[name="{heading}"s][level=2] >> xpath=..',
    checkRefundButton: 'role=button[name="Check eligibility for refund?"s]',
    backToMyBookingsButton: 'role=button[name="← Back to My Bookings"s]',
  },
});
