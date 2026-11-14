# API Test Cases — Booking edge cases

| Item         | Value |
| ------------ | ----- |
| Story        | US-114 AC5 — validation, errors and rules around `POST /bookings` |
| Base URL     | `https://api.eventhub.rahulshettyacademy.com/api` |
| Authorization | Bearer token from `POST /auth/login`, sent by the framework. |
| Automated in | `tests/api/edgecases/` (`createBookingValidation`, `bookingOwnership`, `bookSameEventTwice`) |
| Test data    | Events are created where the seat count must be known. Everything created is deleted through the API after each test. |

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

## Booking ownership: `bookingOwnership.spec.ts`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-18a | The owner can read their own booking (positive control) | Account A creates an event and books 1 ticket → A calls `GET /bookings/{id}`, `GET /bookings/ref/{ref}` and `GET /bookings` | Both reads return 200 with the same booking and it is in A's list. |
| TC-API-18 | Another user's booking is protected | Account A creates an event and books 1 ticket → account B calls `GET /bookings/{id}`, `GET /bookings/ref/{ref}`, `GET /bookings` and `DELETE /bookings/{id}` | B gets 403 on the id and reference reads and 404 on the cancel call, and the booking is not in B's list. For A the booking is still "confirmed" and the seat is still taken. |

## Same event twice: `bookSameEventTwice.spec.ts`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-24 | The same user books the same event twice | Create an event with 20 seats → book twice with the same user | Two separate bookings with different ids and references; both are listed; the event shows 16 seats. (Whether this should be allowed is a Product Owner question.) |
