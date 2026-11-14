# API Test Cases — Bookings

| Item         | Value |
| ------------ | ----- |
| Story        | US-114 AC5 — the same works through the API using `POST /api/bookings` (also AC1–AC4 through the API) |
| Base URL     | `https://api.eventhub.rahulshettyacademy.com/api` |
| Authorization | Bearer token from `POST /auth/login`. The framework logs in and sends the token; tests never do. |
| Automated in | `tests/api/createBooking.spec.ts`, `tests/api/cancelBooking.spec.ts`, `tests/api/createBookingValidation.spec.ts`, `tests/api/edgecases/*.spec.ts` |
| Test data    | Bookings are made on existing events; events are created only where the seat count must be known. Everything created is deleted through the API after each test. |

Manual steps: use Swagger ("API Docs" in the nav bar) or Postman. Authorize with the token from `POST /auth/login`.
Note: the Swagger spec declares bearer security only on `/auth/me`, so send the `Authorization: Bearer <token>` header yourself for the other endpoints.
Clear the pre-filled filters of `GET /events` or the list comes back empty.

## Create a booking: `createBooking.spec.ts`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-01 | Booking is created with a reference | `GET /events` → pick an event with at least 2 seats → `POST /bookings` with `eventId`, `quantity` 2, `customerName`, `customerEmail`, `customerPhone` | Success response. Body has `bookingRef` matching `^[A-Z0-9]+-[A-Z0-9]{6}$`, `status` "confirmed", the same `eventId`, `quantity` and customer details. |
| TC-API-02 | Total price (AC2) | Book 3 tickets on an event | `totalPrice` = event `price` × 3. |
| TC-API-03 | Booking appears in the list (AC3) | Book 2 tickets on every listed event, then `GET /bookings` | Each booking is listed with its `id`, `eventId`, `quantity` 2, `status` "confirmed" and an embedded `event` with the same id and title. |
| TC-API-04 | Seats are reduced | Read `availableSeats`, book 4 tickets, read again | Seats available = before − 4. |

## Cancel a booking: `cancelBooking.spec.ts`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-05 | Cancel restores seats and removes the booking (AC4) | Book 2 tickets on each event → `DELETE /bookings/{id}` | 200 and `success: true`. Seats are back to the value before booking. The booking is not in `GET /bookings`. |
| TC-API-06 | Cancelled booking cannot be fetched | Book 1 ticket → cancel → `GET /bookings/{id}` | 404. |
| TC-API-07 | Cancelling twice | Book 1 ticket → cancel → cancel again | First call 200, second call 404. |

## Validation and errors: `createBookingValidation.spec.ts`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-08 | Required field missing | `POST /bookings` without `customerEmail` | 400, `success: false`, the message mentions `customerEmail`. |
| TC-API-09 | Quantity 0 | `POST /bookings` with `quantity` 0 | 400. |
| TC-API-10 | Negative quantity | `POST /bookings` with `quantity` -1 | 400. |
| TC-API-11 | Quantity above the limit | `POST /bookings` with `quantity` 11 | 400 (the maximum per booking is 10). |
| TC-API-12 | Unknown event | `POST /bookings` with `eventId` 999999999 | 404, nothing is created. |
| TC-API-13 | More tickets than seats | Create an event with 2 seats → book 3 | 400. `availableSeats` is still 2. |
| TC-API-14 | No token | `POST /bookings` without the `Authorization` header | 401. |

## Edge cases: `tests/api/edgecases`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-15 | Book a newly created event (`bookNewEvent`) | Create an event with 20 seats → check it is listed → book 2 | Event listed with 20 seats; booking "confirmed"; event then shows 18 seats; booking listed with the right `eventId`. |
| TC-API-16 | Edit an event that has a booking (`editBookedEvent`) | Create event → book 2 → `PUT /events/{id}` (new title, city, category, price 75) | Events list shows the new values. The booking is still listed and its embedded `event` shows the new values. |
| TC-API-17 | Delete an event that has a booking (`deleteBookedEvent`) | Create event → book 2 → `DELETE /events/{id}` | 200. The event is not listed and `GET /events/{id}` returns 404. The booking is also gone (cascade delete). |
