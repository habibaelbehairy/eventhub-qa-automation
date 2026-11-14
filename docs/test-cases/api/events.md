# API Test Cases — Events

| Item         | Value |
| ------------ | ----- |
| Story        | Beyond US-114: the event data that bookings depend on (create, edit, delete, prices) |
| Base URL     | `https://api.eventhub.rahulshettyacademy.com/api` |
| Authorization | Bearer token from `POST /auth/login`, sent by the framework. |
| Automated in | `tests/api/events/`, `tests/api/edgecases/createEventValidation.spec.ts` |
| Test data    | Events are created per test and deleted through the API afterwards. |

Booking tests are in [bookings.md](bookings.md).

## Create and validate: `createEventValidation`, `createPastEvent`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-17a | Event creation is validated and needs a login (`createEventValidation`) | `POST /events` with a missing title, city, venue, date, price or seats; a blank title; a negative price; 0 or negative seats; and with no token | 400 for every invalid input (no event is created); 401 without a token (also for `GET /bookings`). |
| TC-API-22 | A past event cannot be created (`createPastEvent`) | `POST /events` with an `eventDate` in the past | 400 with a message that mentions `eventDate` ("Event date must be in the future"); the number of events is unchanged. Because of this, only the seeded past events can be booked (see the PO questions). |

## Events with bookings: `bookNewEvent`, `editBookedEvent`, `deleteBookedEvent`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-15 | Book a newly created event (`bookNewEvent`) | Create an event with 20 seats → check it is listed → book 2 | Event listed with 20 seats; booking "confirmed"; event then shows 18 seats; booking listed with the right `eventId`. |
| TC-API-16 | Edit an event that has a booking (`editBookedEvent`) | Create event → book 2 → `PUT /events/{id}` (new title, city, category, price 75) | Events list shows the new values. The booking is still listed and its embedded `event` shows the new values. |
| TC-API-17 | Delete an event that has a booking (`deleteBookedEvent`) | Create event → book 2 → `DELETE /events/{id}` | 200. The event is not listed and `GET /events/{id}` returns 404. The booking is also gone (cascade delete). |

## Prices: `eventPrices`

| ID | Test case | Steps | Expected |
| -- | --------- | ----- | -------- |
| TC-API-23 | Prices are kept exactly | (a) Create an event with price 12.35 → book 3. (b) Create an event with price 0 → book 2. | (a) The API returns the price "12.35" on create and list, and `totalPrice` 37.05; the UI rounds it (defect 2, `decimalPriceEvent`). (b) The booking is "confirmed", `totalPrice` is 0 and the event shows 18 seats. |
