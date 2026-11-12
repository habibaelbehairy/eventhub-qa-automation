# UI Test Cases — Booking Details page

| Item         | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Story        | US-114 AC3 (view my bookings) and AC4 (cancel a booking)              |
| Page         | Booking details `/bookings/{id}`, opened with "View Details" on My Bookings |
| Automated in | `tests/ui/booking/verifyBookingDetails.spec.ts` (TC-BD-01..07), `tests/ui/cancellation/cancelFromBookingDetails.spec.ts` (TC-BD-08..10) |
| Test data    | Books tickets on an existing featured concert. If the booking is still listed after a test, `afterEach` cancels it through the UI (no API). |

## Verify the booking details

| ID        | Test case                                   | Steps                                          | Expected |
| --------- | ------------------------------------------- | ---------------------------------------------- | -------- |
| TC-BD-01  | Open the booking                            | Home → featured concert → book 2 tickets → My Bookings → View Details | The Booking Details page opens. |
| TC-BD-02  | Header                                      | Read the top of the page                       | Event title, the booking reference from the confirmation, and status "confirmed". |
| TC-BD-03  | Blocks shown                                | Check the page blocks                          | Event Details, Customer Details and Payment Summary are visible. |
| TC-BD-04  | Customer Details                            | Read the Customer Details block                | Name, email and phone are the ones entered in the booking form. |
| TC-BD-05  | Payment Summary                             | Read the Payment Summary block                 | Tickets = 2, Price per ticket = the card price, Total Paid = price × 2. |
| TC-BD-06  | Cancel button for a confirmed booking       | Check the actions                              | "Cancel Booking" is visible. |
| TC-BD-07  | Back to My Bookings                         | Click "← Back to My Bookings"                  | The My Bookings list opens and the booking is still listed. |

## Cancel from the Booking Details page

| ID        | Test case                                   | Steps                                          | Expected |
| --------- | ------------------------------------------- | ---------------------------------------------- | -------- |
| TC-BD-08  | Cancel dialog                               | Book 1 ticket → View Details → Cancel Booking  | The "Cancel this booking?" dialog appears with "Yes, cancel it" and "Cancel". |
| TC-BD-09  | Confirm the cancellation                    | Click "Yes, cancel it"                         | The dialog closes; the booking is no longer in My Bookings. |
| TC-BD-10  | Seat is released                            | Go to Home and read the event card             | Seats available = the value before booking. |
