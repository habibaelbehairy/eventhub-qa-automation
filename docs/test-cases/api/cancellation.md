# API Test Cases — Cancellation

| Item         | Value |
| ------------ | ----- |
| Story        | US-114 AC4 — cancel a booking through the API (`DELETE /bookings/{id}`) |
| Base URL     | `https://api.eventhub.rahulshettyacademy.com/api` |
| Authorization | Bearer token from `POST /auth/login`, sent by the framework. |
| Automated in | `tests/api/cancellation/cancelBooking.spec.ts` |
| Test data    | Bookings are made on existing events and deleted after each test. |

Other cancellation rules (deadline, refund) are open questions for the Product Owner. A booking owned by another user cannot be cancelled: see [edge-cases.md](edge-cases.md) (TC-API-18).

## Cancel a booking: `cancelBooking.spec.ts`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-05 | Cancel restores seats and removes the booking (AC4) | Book 2 tickets on each event → `DELETE /bookings/{id}` | 200 and `success: true`. Seats are back to the value before booking. The booking is not in `GET /bookings`. |
| TC-API-06 | Cancelled booking cannot be fetched | Same event, after the cancel → `GET /bookings/{id}` | 404. |
| TC-API-07 | Cancelling twice | Same event, after the cancel → `DELETE /bookings/{id}` again | First call 200, second call 404. |
