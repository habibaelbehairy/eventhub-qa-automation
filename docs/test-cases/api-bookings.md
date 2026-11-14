# API Test Cases — Bookings

| Item         | Value |
| ------------ | ----- |
| Story        | US-114 AC5 — the same works through the API using `POST /api/bookings` (also AC1–AC4 through the API) |
| Base URL     | `https://api.eventhub.rahulshettyacademy.com/api` |
| Authorization | Bearer token from `POST /auth/login`. The framework logs in and sends the token; tests never do. |
| Automated in | `tests/api/booking/`, `tests/api/cancellation/`, `tests/api/edgecases/` |
| Test data    | Bookings are made on existing events; events are created only where the seat count must be known. Everything created is deleted through the API after each test. |

Manual steps: use Swagger ("API Docs" in the nav bar) or Postman. Authorize with the token from `POST /auth/login`.
Note: the Swagger spec declares bearer security only on `/auth/me`, so send the `Authorization: Bearer <token>` header yourself for the other endpoints.
Clear the pre-filled filters of `GET /events` or the list comes back empty.

## Create a booking: `createBooking.spec.ts`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-01 | Booking is created with a reference (every listed event) | `GET /events` → for each event → `POST /bookings` with `eventId`, `quantity` 2, `customerName`, `customerEmail`, `customerPhone` | Success response. Body has `bookingRef` matching `^[A-Z0-9]+-[A-Z0-9]{6}$`, `status` "confirmed", the same `eventId`, `quantity` and customer details. |
| TC-API-02 | Total price (AC2) | Book 2 tickets on every listed event | For each event, `totalPrice` = event `price` × 2. |
| TC-API-03 | Booking appears in the list (AC3) | Book 2 tickets on every listed event, then `GET /bookings` | Each booking is listed with its `id`, `eventId`, `quantity` 2, `status` "confirmed" and an embedded `event` with the same id and title. |
| TC-API-04 | Seats are reduced | Read `availableSeats`, book 2 tickets on each event, read again | Seats available = before − 2. |

## Cancel a booking: `cancelBooking.spec.ts`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-05 | Cancel restores seats and removes the booking (AC4) | Book 2 tickets on each event → `DELETE /bookings/{id}` | 200 and `success: true`. Seats are back to the value before booking. The booking is not in `GET /bookings`. |
| TC-API-06 | Cancelled booking cannot be fetched | Same event, after the cancel → `GET /bookings/{id}` | 404. |
| TC-API-07 | Cancelling twice | Same event, after the cancel → `DELETE /bookings/{id}` again | First call 200, second call 404. |

## Validation and errors: `createBookingValidation.spec.ts`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-08 | Required field missing | `POST /bookings` without `customerEmail` | 400, `success: false`, the message mentions `customerEmail`. |
| TC-API-09 | Quantity 0 | `POST /bookings` with `quantity` 0 | 400. |
| TC-API-10 | Negative quantity | `POST /bookings` with `quantity` -1 | 400. |
| TC-API-11 | Quantity above the limit | `POST /bookings` with `quantity` 11 | 400 (the maximum per booking is 10). |
| TC-API-12 | Unknown event | `POST /bookings` with `eventId` 999999999 | 404, and the number of bookings in `GET /bookings` is unchanged. |
| TC-API-13 | More tickets than seats | Create an event with 2 seats → book 3 | 400. `availableSeats` is still 2. |
| TC-API-14 | No token | `POST /bookings` without the `Authorization` header | 401. |
| TC-API-19 | Maximum quantity is accepted | Create an event with 20 seats → book 10 | 201, `quantity` 10, `availableSeats` is 10. |
| TC-API-20 | Invalid email | `POST /bookings` with email `plainaddress`, `user@`, `@example.com` or `user name@example.com` | 400 each time; no seats are taken. |
| TC-API-21 | Invalid phone | `POST /bookings` with phone `123456789` (9 digits) or `abcdefghij` (letters) | 400 each time; no seats are taken. |
| TC-API-18a | The owner can read their own booking (`bookingOwnership`, positive control) | Account A creates an event and books 1 ticket → A calls `GET /bookings/{id}`, `GET /bookings/ref/{ref}` and `GET /bookings` | Both reads return 200 with the same booking and it is in A's list. |
| TC-API-18 | Another user's booking is protected (`bookingOwnership`) | Account A creates an event and books 1 ticket → account B calls `GET /bookings/{id}`, `GET /bookings/ref/{ref}`, `GET /bookings` and `DELETE /bookings/{id}` | B gets 403 or 404 on the id, reference and cancel calls, and the booking is not in B's list. For A the booking is still "confirmed" and the seat is still taken. |

## Edge cases: `tests/api/edgecases`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-15 | Book a newly created event (`bookNewEvent`) | Create an event with 20 seats → check it is listed → book 2 | Event listed with 20 seats; booking "confirmed"; event then shows 18 seats; booking listed with the right `eventId`. |
| TC-API-16 | Edit an event that has a booking (`editBookedEvent`) | Create event → book 2 → `PUT /events/{id}` (new title, city, category, price 75) | Events list shows the new values. The booking is still listed and its embedded `event` shows the new values. |
| TC-API-17a | Event creation is validated and needs a login (`createEventValidation`) | `POST /events` with a missing title, city, venue, date, price or seats; a blank title; a negative price; 0 or negative seats; and with no token | 400 for every invalid input (no event is created); 401 without a token (also for `GET /bookings`). |
| TC-API-17 | Delete an event that has a booking (`deleteBookedEvent`) | Create event → book 2 → `DELETE /events/{id}` | 200. The event is not listed and `GET /events/{id}` returns 404. The booking is also gone (cascade delete). |
