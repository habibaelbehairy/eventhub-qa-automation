# UI Test Cases — Booking edge cases (US-114)

| Item         | Value |
| ------------ | ----- |
| Automated in | `tests/ui/edgecases/` |
| Approach     | UI only: no mocks, no API calls (setup, checks and cleanup all go through the UI). |
| Test data    | Only TC-EDGE-09 creates a real booking; it is cancelled through My Bookings afterwards. All other cases never confirm a valid form. |
| Tag          | `@edge` — run with `npx playwright test --grep @edge` |

## Ticket quantity — `ticketQuantity.spec.ts`

| ID          | Test case | Expected |
| ----------- | --------- | -------- |
| TC-EDGE-01  | Default quantity and lower bound | Quantity is 1; − is disabled. |
| TC-EDGE-02  | Upper bound (event with ≥ 10 seats) | Hint "(max 10)"; + stops at 10; − works again from 10. |
| TC-EDGE-03  | Over-booking prevented: fewer than 10 seats left (e.g. World Tech Summit) | Hint "(max N)" where N = seats left; + stops at N. Skipped if no such event exists. |

## Form content and validation — `bookingFormValidation.spec.ts`

Each validation case fills only the field under test; the others stay empty, so no booking can be created.

| ID          | Test case | Expected |
| ----------- | --------- | -------- |
| TC-EDGE-04  | Form content | Price + "per ticket"; labels "Full Name*", "Email*", "Phone Number*"; placeholders "Your full name", "you@email.com", "+91 98765 43210"; Confirm Booking enabled. |
| TC-EDGE-05  | Empty form | All three errors shown; no confirmation. |
| TC-EDGE-06  | Name | "A" rejected; "Al" accepted; spaces only rejected; "O'Brien-Smith" accepted. |
| TC-EDGE-07  | Email | "plainaddress", "user@", "@example.com", "user name@example.com" rejected; "user@example.com" accepted. |
| TC-EDGE-08  | Phone | 9 digits, 11 digits, letters rejected; 10 digits accepted; "+91 98765 43210" (the placeholder) accepted. |

## Submission — `bookingResilience.spec.ts`

| ID          | Test case | Expected |
| ----------- | --------- | -------- |
| TC-EDGE-09  | Double-click Confirm Booking | Exactly one new booking in My Bookings. Afterwards all bookings for that event are cancelled through My Bookings. |

## Expected outcomes still to confirm on first run

These expectations describe what *should* happen; the app's actual behaviour has not been observed
yet. A failure here is a finding for the story review, not necessarily a broken test.

- Spaces-only name and the "+91 98765 43210" phone (TC-EDGE-06, 08).
- Whether + is disabled or just stops at the maximum (TC-EDGE-02, 03; the test handles both).

## Not covered (would need mocking or the API)

- Server rejects the booking because another user took the seats between page load and Confirm.
- Server error / network failure while confirming.

## Not automated (story review / PO questions)

- Past events can be booked (World Tech Summit 18 Apr 2026, Hollywood Monsoon Night 11 Jul 2026).
- Can the same customer book the same event several times?
- Cancellation rules (deadline, refunds).
