# UI Test Cases — Booking tickets from the Home screen

| Item         | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Story        | US-114 AC1 (create a booking), AC2 (total price), AC3 (booking in My Bookings) |
| Page         | Home `/` → event details `/events/{id}` → My Bookings                 |
| Automated in | `tests/ui/booking/bookFeaturedEventTicket.spec.ts` (TC-BK-01..07), `tests/ui/booking/bookMultipleTickets.spec.ts` (TC-BK-08..11) |
| Test data    | Featured tests book 1 ticket on a shared demo event; multiple-ticket tests book on the first card with enough seats. The `bookings` cleanup fixture deletes every booking through the API afterwards. |

## Featured event, full flow — `bookFeaturedEventTicket.spec.ts`

One run each for a featured Festival, Concert and Conference.

| ID        | Test case                          | Steps                                                         | Expected |
| --------- | ---------------------------------- | ------------------------------------------------------------- | -------- |
| TC-BK-01  | Card content                       | Home → find the featured card of the category                 | Category badge, title, date, "venue, city", price, seats and Book Now are shown. |
| TC-BK-02  | Open the event                     | Click Book Now                                                | The `/events/{id}` page loads with the card's title, the category and Featured badges and the featured banner. |
| TC-BK-03  | Date, time, venue and city         | Read the details page                                         | Date and location match the card; time matches the API `eventDate` in the browser time zone. |
| TC-BK-04  | Seats and price                    | Read seats and price per ticket                               | They equal the card values. |
| TC-BK-05  | Booking form defaults              | Read the Book Tickets form                                    | Price = card price, quantity 1 with the decrease button disabled, name, email and phone empty. |
| TC-BK-06  | Book 1 ticket                      | Fill name, email, phone → Confirm Booking                     | The confirmation shows a reference, the customer, 1 ticket and total = price. |
| TC-BK-07  | Booking in My Bookings             | Open My Bookings                                              | The card with the reference shows the event title, status "confirmed" and 1 ticket. |

## Multiple tickets — `bookMultipleTickets.spec.ts`

One run each for 2, 4 and 10 tickets (10 is the maximum per booking).

| ID        | Test case                          | Steps                                                         | Expected |
| --------- | ---------------------------------- | ------------------------------------------------------------- | -------- |
| TC-BK-08  | Pick an event with enough seats    | Home → first card with at least the quantity in seats → Book Now | The details page shows the card's title and price and has at least the quantity in seats. |
| TC-BK-09  | Book N tickets                     | Set the quantity → fill the form → Confirm Booking            | The confirmation shows a reference, the customer, N tickets and total = price × N. |
| TC-BK-10  | Seats go down                      | Reload the details page                                       | Available seats dropped by at least N (shared event: others may book too). |
| TC-BK-11  | Booking in My Bookings             | Open My Bookings                                              | The card shows the event title, "confirmed", N tickets and total = price × N. |

The seat check runs on a shared event, so a mismatch fails with a message pointing at concurrent
activity, and the single CI retry covers a one-off collision (reported as flaky).

Form validation, quantity limits, booking the same event twice and anonymous access are in
[edge-cases.md](edge-cases.md). Booking from the Events page is in [events.md](events.md).
