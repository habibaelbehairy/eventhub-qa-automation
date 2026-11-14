# UI Test Cases — Booking edge cases (US-114)

| Item         | Value |
| ------------ | ----- |
| Automated in | `tests/ui/edgecases/` |
| Approach     | UI only: no mocks, no API calls (setup, checks and cleanup all go through the UI). |
| Test data    | Any booking a test creates is tracked and cancelled afterwards by the cleanup fixture. |
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
| TC-EDGE-06  | Name | "A" rejected; spaces only rejected; "O'Brien-Smith" accepted. |
| TC-EDGE-07  | Email | "plainaddress", "user@", "@example.com", "user name@example.com" rejected; "user@example.com" accepted. |
| TC-EDGE-08  | Phone | 9 digits and letters rejected. |
| TC-EDGE-09  | Valid form | With a valid name, email and phone ("+91 98765 43210") the booking is confirmed; the booking reference is tracked and cancelled by the cleanup fixture. |

## Expected outcomes still to confirm on first run

These expectations describe what *should* happen; the app's actual behaviour has not been observed
yet. A failure here is a finding for the story review, not necessarily a broken test.

- Spaces-only name (TC-EDGE-06).
- Whether + is disabled or just stops at the maximum (TC-EDGE-02, 03; the test handles both).

## Not automated (story review / PO questions)

- Past events can be booked (World Tech Summit 18 Apr 2026, Hollywood Monsoon Night 11 Jul 2026).
- Can the same customer book the same event several times?
- Cancellation rules (deadline, refunds).
