import { defineSelectors } from '../../utils/selectorDefinition';

export default defineSelectors({
  selector: 'main',
  props: {
    path: '/events/{id}',
    maxTicketsPerBooking: 10,
    validationMessages: {
      name: 'Name must be at least 2 chars',
      email: 'Enter a valid email',
      phone: 'Enter a valid 10-digit phone',
    },
  },
  elements: {
    title: 'role=heading[level=1]',
    // Badges row right above the title: category first, then "Featured" (static demo events only).
    categoryBadge: 'role=heading[level=1] >> xpath=preceding-sibling::div[1]/span[1]',
    featuredBadge: 'role=heading[level=1] >> xpath=preceding-sibling::div[1]/span[normalize-space()="Featured"]',
    featuredBanner: 'text=/This is a featured event/',
    // Info tiles: label paragraph ('Date', 'Venue', 'Available', 'Price per ticket'...) followed by its value.
    infoValue: 'p:text-is("{label}") >> xpath=following-sibling::p[1]',
  },
  sections: {
    // Right-hand "Book Tickets" panel: the form, and after booking the confirmation.
    bookingForm: {
      selector: 'div:has(> div > h2:text-is("Book Tickets"))',
      elements: {
        heading: 'role=heading[name="Book Tickets"s]',
        // "$2,500" next to the "Book Tickets" heading (shown above "per ticket").
        price: 'role=heading[name="Book Tickets"s] >> xpath=following-sibling::span[1]',
        decreaseButton: 'role=button[name="−"s]',
        increaseButton: 'role=button[name="+"s]',
        // The quantity is the element between the − and + buttons.
        quantity: 'role=button[name="−"s] >> xpath=following-sibling::*[1]',
        maxTicketsHint: 'text=/[(]max [0-9]+[)]/',
        nameInput: 'role=textbox[name="Full Name*"s]',
        emailInput: 'role=textbox[name="Email*"s]',
        phoneInput: 'role=textbox[name="Phone Number*"s]',
        summaryLine: 'text=/× [0-9]+ tickets?/',
        total: 'text="Total" >> xpath=following-sibling::*[1]',
        confirmBookingButton: 'role=button[name="Confirm Booking"s]',
        validationError: 'text="{message}"',
      },
      sections: {
        confirmation: {
          selector: 'div:has(> h3:has-text("Booking Confirmed"))',
          elements: {
            heading: 'role=heading[name=/Booking Confirmed/]',
            bookingRef: '.booking-ref',
            // Label/value rows: 'Booking Ref' | 'Customer' | 'Tickets' | 'Total'
            valueByLabel: 'text="{label}" >> xpath=following-sibling::*[1]',
            viewMyBookingsButton: 'role=button[name="View My Bookings"s]',
            browseMoreEventsButton: 'role=button[name="Browse More Events"s]',
          },
        },
      },
    },
  },
});
