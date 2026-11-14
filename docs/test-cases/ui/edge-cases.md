# UI Test Cases — Edge cases

| Item         | Value |
| ------------ | ----- |
| Automated in | `tests/ui/edgecases/` |
| Approach     | Checks go through the UI, no mocks. The API is used only for setup (an event with a known seat count) and for cleanup. |
| Test data    | Bookings and events a test creates are tracked and deleted afterwards by the cleanup fixture. |
| Tag          | `@edge` — run with `npx playwright test --grep @edge` |

## Ticket quantity — `ticketQuantity.spec.ts`

| ID          | Test case | Expected |
| ----------- | --------- | -------- |
| TC-EDGE-01  | Default quantity and lower bound | Quantity is 1; − is disabled. |
| TC-EDGE-02  | Upper bound (event with ≥ 10 seats) | Hint "(max 10)"; + stops at 10; − works again from 10. |
| TC-EDGE-03  | Over-booking prevented: fewer than 10 seats left (e.g. World Tech Summit) | Hint "(max N)" where N = seats left; + stops at N. Skipped if no such event exists. |

## Booking form content and validation — `bookingFormValidation.spec.ts`

Each validation case fills only the field under test; the others stay empty, so no booking can be created.

| ID          | Test case | Expected |
| ----------- | --------- | -------- |
| TC-EDGE-04  | Form content | Price + "per ticket"; labels "Full Name*", "Email*", "Phone Number*"; placeholders "Your full name", "you@email.com", "+91 98765 43210"; Confirm Booking enabled. |
| TC-EDGE-05  | Empty form | All three errors shown; no confirmation. |
| TC-EDGE-06  | Name | "A" rejected; spaces only rejected; "O'Brien-Smith" accepted. |
| TC-EDGE-07  | Email | "plainaddress", "user@", "@example.com", "user name@example.com" rejected; "user@example.com" accepted. |
| TC-EDGE-08  | Phone | 9 digits and letters rejected. |
| TC-EDGE-09  | Valid form | With a valid name, email and phone ("+91 98765 43210") the booking is confirmed; the booking reference is tracked and cancelled by the cleanup fixture. |

## Access without login — `anonymousAccess.spec.ts`

| ID          | Test case | Expected |
| ----------- | --------- | -------- |
| TC-EDGE-10  | Visitor who is not logged in opens `/bookings` | Redirected to `/login`; the "Sign in to EventHub" heading is shown and the My Bookings heading is not. |

## Same event twice — `bookSameEventTwice.spec.ts`

| ID          | Test case | Expected |
| ----------- | --------- | -------- |
| TC-EDGE-11  | The same user books the same event twice (event with 20 seats, 2 tickets each time) | Each booking gets its own reference; My Bookings shows two cards for the event. The app allows it; the story does not say if it should (Product Owner question). |

## Event form content and validation (admin) — `eventFormValidation.spec.ts`

The "+ New Event" form in Admin > Manage Events is filled step by step, each test adding a valid value or checking one invalid value. Invalid input creates no event.

| ID          | Test case | Expected |
| ----------- | --------- | -------- |
| TC-EDGE-12  | Form content | Labels and the Add Event button are shown; every field is empty. |
| TC-EDGE-13  | Empty form | Six inline errors; no event is created. |
| TC-EDGE-14  | Title, city, venue | Only spaces rejected; a valid value accepted. |
| TC-EDGE-15  | Description (optional) | No error when empty or filled. |
| TC-EDGE-16  | Date | A past date gives "Must be a future date"; a future date is accepted. |
| TC-EDGE-17  | Price | -1 rejected; 0 (free) and 49.99 accepted. |
| TC-EDGE-18  | Seats | 0 and -5 rejected. |
| TC-EDGE-19  | Seats 1.5 (`@xfail`) | Expected: an inline seats error. Actual: no error is shown (defect 3, expected failure). |
| TC-EDGE-20  | Valid form | With every field valid, Add Event creates the event. |

## Prices (admin) — `freeEvent.spec.ts`, `decimalPriceEvent.spec.ts`

| ID          | Test case | Expected |
| ----------- | --------- | -------- |
| TC-EDGE-21  | Free event (`freeEvent`) | Created with price 0; the details page shows $0 per ticket and a $0 total; the booking is confirmed. |
| TC-EDGE-22  | Decimal price (`decimalPriceEvent`, `@xfail`) | Expected: $12.35 and a total of $37.05. Actual: the UI shows $12 and a rounded total (defect 2, expected failure). |

Creating a past event is checked in [events.md](events.md) (TC-EV-05).

## Not automated (story review / PO questions)

- Past events can be booked (World Tech Summit 18 Apr 2026, Hollywood Monsoon Night 11 Jul 2026). Not automated: a past event cannot be created in the UI or the API (see [events.md](events.md) TC-EV-05 and [../api/events.md](../api/events.md) TC-API-22), so there is no test data for it. Ask the Product Owner whether this is intended.
- Cancellation rules (deadline, refunds).
