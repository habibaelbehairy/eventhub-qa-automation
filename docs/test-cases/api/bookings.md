# API Test Cases — Bookings

| Item         | Value |
| ------------ | ----- |
| Story        | US-114 AC5 — the same works through the API using `POST /api/bookings` (also AC1–AC4 through the API) |
| Base URL     | `https://api.eventhub.rahulshettyacademy.com/api` |
| Authorization | Bearer token from `POST /auth/login`. The framework logs in and sends the token; tests never do. |
| Automated in | `tests/api/booking/` |
| Test data    | Bookings are made on existing events; events are created only where the seat count must be known. Everything created is deleted through the API after each test. |

Manual steps: use Swagger ("API Docs" in the nav bar) or Postman. Authorize with the token from `POST /auth/login`.
Note: the Swagger spec declares bearer security only on `/auth/me`, so send the `Authorization: Bearer <token>` header yourself for the other endpoints.
Clear the pre-filled filters of `GET /events` or the list comes back empty.
Status codes used in these tests: **201** for every `POST` that creates something (`/events`, `/bookings`), **200** for `GET`, `PUT` and `DELETE`, **400** for invalid input, **401** without a token, **403** and **404** for another user's data (see Q-21 in the README).

Related: [cancellation.md](cancellation.md), [edge-cases.md](edge-cases.md) (validation, ownership, same event twice) and [events.md](events.md) (event create, edit, delete, prices).

## Create a booking: `createBooking.spec.ts`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-01 | Booking is created with a reference (every listed event) | `GET /events` → for each event → `POST /bookings` with `eventId`, `quantity` 2, `customerName`, `customerEmail`, `customerPhone` | 201 and `success: true`. Body has `bookingRef` matching `^[A-Z0-9]+-[A-Z0-9]{6}$`, `status` "confirmed", the same `eventId`, `quantity` and customer details. |
| TC-API-02 | Total price (AC2) | Book 2 tickets on every listed event | 201 for every booking. For each event, `totalPrice` = event `price` × 2. |
| TC-API-03 | Booking appears in the list and can be fetched (AC3) | Book 2 tickets on every listed event, then `GET /bookings`, `GET /bookings/ref/{ref}` and `GET /bookings/{id}` | 201 on the booking, 200 on the three reads. Each response has the booking with its `id`, `bookingRef`, `eventId` and an embedded `event` with the same id and title; the list also shows `quantity` 2 and `status` "confirmed". |
| TC-API-04 | Seats are reduced | Read `availableSeats`, book 2 tickets on each event, read again | 201 on each booking, 200 on the reads. Seats available = before − 2. |
