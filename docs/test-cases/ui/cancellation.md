# UI Test Cases — Cancel bookings

| Item         | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Story        | US-114 AC4 — I can cancel a booking                                   |
| Pages        | Home → Event details → My Bookings (`/bookings`) |
| Automated in | `tests/ui/cancellation/cancelFeaturedEventBooking.spec.ts`, `tests/ui/cancellation/cancelFromBookingDetails.spec.ts`, `tests/ui/cancellation/clearAllBookings.spec.ts` |
| Test data    | Bookings are made on existing events and cancelled in the test. If a test stops early, the `bookings` cleanup fixture deletes what is left through the API. |

Cancelling from the Booking Details page is in [booking-details.md](booking-details.md).

Each spec file reuses one browser window and one login (the auth fixture); the window is closed after the file.
Seat checks compare the Home card before booking with the Home card after cancelling. Another user
on the shared environment can change the count at the same moment, and the failure message says so.

## Cancel one booking: `cancelFeaturedEventBooking.spec.ts`

| ID        | Test case                                   | Steps                                          | Expected |
| --------- | ------------------------------------------- | ---------------------------------------------- | -------- |
| TC-CAN-01 | Cancel a featured booking from My Bookings (Concert, Conference, Festival, one run each) | Home → first featured card of the category with seats → Book Now → book 1 ticket → My Bookings | The card with the reference is listed with the event title and status "confirmed". |
| TC-CAN-02 | Cancel dialog content                       | Click "Cancel Booking" on that card            | Dialog "Cancel this booking?" shows the reference and "release 1 seat(s)", with "Yes, cancel it" and "Cancel" buttons. |
| TC-CAN-03 | Dismiss the cancel dialog                   | Click "Cancel" in the dialog                   | The dialog closes and the booking is still listed. |
| TC-CAN-04 | Confirm the cancellation                    | Cancel Booking → "Yes, cancel it"              | The dialog closes and the booking card is no longer listed. |
| TC-CAN-05 | Seat is released                            | Go to Home and read the event card             | Seats available = the value before booking. |

## Clear all bookings: `clearAllBookings.spec.ts`

| ID        | Test case                                   | Steps                                          | Expected |
| --------- | ------------------------------------------- | ---------------------------------------------- | -------- |
| TC-CAN-06 | Several bookings are listed                 | Home → pick 3 events with at least 2 seats → book 2 tickets on each → My Bookings | All 3 references are listed, each with its event title, 2 tickets and total = price × 2. |
| TC-CAN-07 | Clear all bookings                          | Click "Clear all bookings" and confirm         | No booking cards; "No bookings yet" and "Browse Events" are shown. |
| TC-CAN-08 | Cleared bookings stay gone                  | Reload My Bookings                             | Still no booking cards. |
| TC-CAN-09 | All seats are released                      | Go to Home and read the 3 event cards          | Each event shows the seats it had before booking. |

"Clear all bookings" deletes every booking of the logged-in account, not only the ones this test
made. Only run it with the dedicated test account.

## Observations for the story review

| Observation | Impact |
| ----------- | ------ |
| "Clear all bookings" is not mentioned in the story. | Its behaviour is not specified: is a confirmation required, and can it be undone? |
| The confirmation style of "Clear all bookings" has not been observed yet. The page object accepts either a native browser confirm or an in-page modal. | Check this on the first run, then simplify the page object. |
| A cancelled booking disappears completely (hard delete), although a "cancelled" status exists. | There is no cancellation history for the user, and the "cancelled" status is never shown. |
