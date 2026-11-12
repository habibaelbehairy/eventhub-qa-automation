# EventHub QA Automation

Playwright + TypeScript UI and API automation for story **US-114 "Book tickets for an event"** (AC1-AC5).

## Setup and run

```powershell
npm ci
npx playwright install chromium
Copy-Item data/testcredentials.example.json data/testcredentials.json   # optional: only to use your own accounts
npm test                          # everything (ui + api)
npx playwright test --project=ui
npx playwright test --project=api
npm run typecheck
npm run report                    # open the HTML report
```

Optional `.env`: `BASE_URL`, `API_BASE_URL`, `HEADLESS=false`, `SLOW_MO=500` (watch the flow locally).

**Credentials.** Two throwaway test accounts on the public EventHub site are committed in [data/testcredentials.json](data/testcredentials.json) (roles `primaryUser` and `secondaryUser`), so `npm test` works right after `npm ci`. To use your own accounts, register them at https://eventhub.rahulshettyacademy.com and edit that file (`data/testcredentials.example.json` shows the shape).

**Parallel runs.** Each worker runs as its own account (worker 0 = `primaryUser`, worker 1 = `secondaryUser`), so the default is 2 workers. Use `$env:WORKERS=1` for a serial run. Do not run the `ui` and `api` projects in two terminals at the same time, because they would share the accounts. Tests inside one spec file always run in order. A failed test is retried once; a test that passes on the retry is reported as flaky.

**Expected red tests.** Two tests in `tests/ui/admin/events/decimalPriceEvent.spec.ts` fail on purpose. They document a real product bug (decimal prices are rounded in the UI, see the story review). Everything else should be green, so CI shows exactly 2 failures until the bug is fixed.

`npm run cleanup` removes bookings and events left on the test account by an interrupted run.

In CI ([.github/workflows/playwright.yml](.github/workflows/playwright.yml)) the committed credentials file is used, so no repository secrets are needed. The HTML report is uploaded as an artifact.

## Story review

Manual test cases are in [docs/test-cases](docs/test-cases).

### What is wrong, missing or unclear in US-114

| Area | Problem | Question for the Product Owner |
| --- | --- | --- |
| Actor | The story says "visitor", but booking needs a registered, logged-in user (anonymous visitors are sent to login). | Should a guest be able to book, or should the story say "registered user"? |
| AC1 | No limits: minimum and maximum tickets per booking, and what happens when more tickets than seats are requested. | What are the quantity limits, and what message is shown when seats run out? |
| AC1 | No validation rules for name, email and phone (format, length, country code, required or optional). | What is valid for each field, and what are the exact error messages? |
| AC1 | "Confirmation with a booking reference" does not say what the reference looks like. Documented `EVT-XXXXXX`, but the app uses a prefix from the event title (see below). | Which format is correct? Is it unique and permanent? |
| AC1 | Nothing about seats: are available seats reduced after booking, and are they given back after cancellation? Nothing about past or sold-out events. | Can a past or sold-out event be booked? Should the Book button be disabled? |
| AC2 | "Ticket price multiplied by number of tickets" says nothing about currency, rounding, decimal prices, taxes or fees. | How are decimal prices and rounding handled? Are there any fees? |
| AC3 | "Appears in My Bookings" does not say which details are shown, or the order of the list. | Which fields must My Bookings show, and in what order? |
| AC4 | "I can cancel" has no rules: who can cancel, until when, refund, and the status afterwards (is it deleted or marked cancelled?). | Is there a cancellation deadline or refund? Is the booking kept as cancelled? |
| AC5 | Only says "the same works through the API". Missing: authentication, request and response shape, error codes, idempotency (double submit). | What are the required fields, status codes and error format? |
| Whole story | No non-functional criteria: duplicate bookings for the same event, concurrent booking of the last seats, accessibility. | Should one user be able to book the same event twice? |

### Assumptions made

- Booking requires login, so the framework logs the test user in by itself (see Key decisions).
- A cancelled booking disappears from My Bookings and gives its seats back; tests check seat counts as a change, not as exact numbers, because the seeded events are shared.
- The booking reference is valid if it matches `/^[A-Z0-9]+-[A-Z0-9]{6}$/`.
- The price shown on the event is the price per ticket in dollars.

### Where the application does not match the story or the docs

- **Decimal prices are rounded in the UI.** An event created with price 12.35 is shown rounded to whole dollars, so the price shown and the total do not match AC2. Two tests in `decimalPriceEvent.spec.ts` fail on purpose to show this bug; they are expected to be red until it is fixed.
- Booking references do not follow the documented `EVT-XXXXXX` format (details below).

### Other findings from exploring the app and API

- The Swagger spec declares bearer security only on `/auth/me`, so "Authorize" does not send the token to other endpoints until the spec is patched.
- The booking reference prefix comes from the event title, so tests assert `/^[A-Z0-9]+-[A-Z0-9]{6}$/` instead of `EVT-XXXXXX`.
- Swagger example filters (category, city, search) are pre-filled and return an empty `GET /events`; clear them.
- Deleting an event that has bookings cascades to the bookings.
- Editing an event is reflected in the embedded event of existing bookings.

## Structure

```text
eventhub-qa-automation/
├── .github/workflows/playwright.yml   CI: type check + run all tests on every push
├── api/                               Typed API client
│   ├── apiSession.ts                    API context per role (reuses saved token or logs in)
│   ├── EventHubApi.ts                   Facade used by tests and cleanup
│   ├── EventsApi.ts / BookingsApi.ts    Endpoint groups
│   ├── paginate.ts / types.ts           Paging helper and response types
├── auth/users.ts                      Accounts, roles, saved-session paths (.auth/<role>.json)
├── common_steps/                      Reusable multi-page flows (open event, book tickets, check seats)
├── config/env.ts                      URLs, timeouts, headless, CI flag
├── data/
│   ├── testcredentials.example.json   Template for the (git-ignored) testcredentials.json
│   └── selectorAlias/                 Selector strings and routes, one file per page object
├── docs/test-cases/                   Manual test cases (UI and API)
├── fixtures/
│   ├── index.ts                       Entry point for UI specs (test, expect, cleanUpTestData)
│   ├── auth.fixture.ts                Logged-in page per worker account, session reuse
│   ├── apiOnly.fixture.ts             API-only tests (no browser)
│   ├── api.fixture.ts                 API client inside UI tests
│   ├── cleanup.fixture.ts             Tracks created bookings/events and deletes them through the API
│   └── pages.fixture.ts               Page objects as fixtures
├── page_objects/                      Locators and actions per page
│   ├── components/                      NavBar, EventCard, BookingCard, dialogs, messages
│   └── admin/                           Manage Events / admin bookings
├── scripts/cleanup.spec.ts            `npm run cleanup`: removes data left by an interrupted run
├── tests/
│   ├── api/                           API project: create, cancel, validation
│   │   └── edgecases/                   book / edit / delete an event that has bookings
│   └── ui/                            UI project
│       ├── booking/                     book from Home or Events, many tickets, booking details
│       ├── cancellation/                cancel from My Bookings or details, clear all
│       ├── edgecases/                   ticket quantity, booking form validation
│       └── admin/events/                create, edit, delete, validate, decimal price
├── utils/                             Test data builders, parsing, dates, selector helpers
├── playwright.config.ts               Projects (ui, api), workers, retries, reporters
└── cleanup.config.ts                  Playwright config for the cleanup script
```

| Folder | Purpose |
| --- | --- |
| `tests/ui`, `tests/api` | Specs, one Playwright project each |
| `page_objects/` | Locators and user actions per page and component |
| `data/selectorAlias/` | Selector strings and routes, one file per page object |
| `common_steps/` | Reusable multi-page flows (open event, book tickets...) |
| `api/` | Typed API client: `EventsApi`, `BookingsApi`, facade `EventHubApi` |
| `fixtures/` | Auth, API, cleanup and page fixtures |
| `config/`, `auth/`, `utils/` | Environment, accounts, test data builders |

## Coverage by acceptance criterion

| AC | UI | API |
| --- | --- | --- |
| AC1 create booking and confirmation | `booking/bookFeaturedEventTicket`, `bookFromEventsPage`, `bookMultipleTickets`, `verifyBookingDetails`; `edgecases/bookingFormValidation`, `ticketQuantity` | `createBooking`, `createBookingValidation`, `edgecases/bookNewEvent` |
| AC2 total price | `bookMultipleTickets` (2, 4, 10 tickets), `admin/events/decimalPriceEvent` (known bug) | `createBooking` (price x quantity) |
| AC3 booking in My Bookings | `bookMultipleTickets`, `verifyBookingDetails`, `cancellation/*` | `createBooking` (listed in `GET /bookings`) |
| AC4 cancel | `cancellation/cancelFeaturedEventBooking`, `cancelFromBookingDetails`, `clearAllBookings` | `cancelBooking` |
| AC5 same through the API | - | all of `tests/api` (`POST /bookings`, validation, auth, seats) |
| Beyond the story | `admin/events/*` (create, edit, delete an event that has bookings) | `edgecases/editBookedEvent`, `deleteBookedEvent` |

The manual test cases behind these are in [docs/test-cases](docs/test-cases) (UI and API).

## Key decisions

1. **Playwright + TypeScript for both UI and API.** One language, one runner, one report and one fixture system. The API client reuses the same auth and cleanup code as the UI tests, so a RestAssured project would only have duplicated it.
2. **Authorization lives in the framework.** The `auth` fixture gives every test a page that is already logged in. It saves the session per role (`.auth/<role>.json`), reuses it while it is fresh, and logs in again by itself if the site rejects it. API tests get a client that reuses the saved token or calls `POST /auth/login`. No spec contains login code. Changing role is one line: `test.use({ role: 'secondaryUser' })`.
3. **Layers with one job each.** Specs say what is checked; page objects hold locators and user actions; `data/selectorAlias` holds the selector strings; `common_steps` holds multi-page flows; `api/` is a typed client (`EventsApi`, `BookingsApi`, facade `EventHubApi`); `fixtures/` wire everything together. A UI change touches one file, and a new test is mostly composition.
4. **Test data is cleaned up by the framework.** Tests call `bookings.track(ref)` or `events.track(title)`; after each test, passed or failed, the tracked data is deleted through the API. `npm run cleanup` removes leftovers from an interrupted run. Tests do not need an `afterEach`.
5. **Tests create their own data when the result must be exact.** Seat counts of the seeded events can change while other people use the shared environment, so tests that need an exact count create their own event. Tests on seeded events check changes (before and after), not absolute numbers.
6. **One account per worker.** Booking data belongs to an account, so two workers on one account would delete each other's bookings (for example `Clear all bookings`). One account per worker keeps parallel runs safe.
7. **What is covered and why.** Every AC has UI and API coverage. Extra depth goes where the risk is: price calculation, ticket limits (1 to 10 and seats left), form validation, seat release on cancellation, over-booking, missing token, and what happens to bookings when their event is edited or deleted. Cosmetic checks and cross-browser runs were left out to keep the suite fast and stable.
8. **Known product bugs stay red.** A test that fails because of a real bug is a useful result, so the decimal price tests are not skipped or inverted.
9. **CI.** GitHub Actions runs a type check and the whole suite on every push and pull request using the committed test accounts, and uploads the HTML report and traces as an artifact. One retry separates flaky tests from real failures.

## What I would do with more time

1. **More accounts or CI sharding.** Parallelism is limited by the number of accounts (2 now). More accounts, or one account per shard, would shorten the run.
2. **A `bookableEvent` fixture.** Create a dedicated event with known seats for every booking test, so no UI test depends on seeded events and seat counts are always exact.
3. **One rule for the folder layout.** Folder names for specs (`edgecases`, `admin/events`) grew by feature; agree on one convention before more people add tests.
4. **Remove the `EventHubApi` delegates.** Let tests use `api.events` and `api.bookings` directly and keep the facade only for shared flows.
5. **Cross-browser runs.** Add Firefox and WebKit projects once the suite is stable on Chromium.
6. **Visual and accessibility checks.** Screenshot comparison of the booking form and confirmation, and axe checks on the booking flow.
7. **Flaky-test reporting.** Keep a trend of retried tests across CI runs so flakiness is seen before it becomes a problem.
8. **Security and concurrency tests.** Cancel another user's booking (needs two accounts in one test), and book the last seats from two sessions at once.
9. **Resolve the open product questions.** Several expected results (quantity limits, rounding, cancellation rules, reference format) are assumptions until the Product Owner answers the questions in the story review.

