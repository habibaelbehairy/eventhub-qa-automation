# EventHub QA Automation

Playwright + TypeScript UI and API automation for story **US-114 "Book tickets for an event"** (AC1-AC5).

## Setup and run

```powershell
npm ci
npx playwright install chromium
Copy-Item data/testcredentials.example.json data/testcredentials.json   # then fill in real accounts
npm test                          # everything (ui + api)
npx playwright test --project=ui
npx playwright test --project=api
npm run typecheck
npm run report                    # open the HTML report
```

Optional `.env`: `BASE_URL`, `API_BASE_URL`, `HEADLESS=false`, `SLOW_MO=500` (watch the flow locally).

`npm run cleanup` removes bookings and events left on the test account by an interrupted run.

In CI ([.github/workflows/playwright.yml](.github/workflows/playwright.yml)) the credentials file is written from repository secrets: `PRIMARY_USER_EMAIL`, `PRIMARY_USER_PASSWORD`, `SECONDARY_USER_EMAIL`, `SECONDARY_USER_PASSWORD`. The HTML report is uploaded as an artifact.

## Story review

Manual test cases are in [docs/test-cases](docs/test-cases). Findings from exploring the app and API:

- The Swagger spec declares bearer security only on `/auth/me`, so "Authorize" does not send the token to other endpoints until the spec is patched.
- Booking references do not follow the documented `EVT-XXXXXX` shape. The prefix comes from the event title, so tests assert `/^[A-Z0-9]+-[A-Z0-9]{6}$/`.
- Swagger example filters (category, city, search) are pre-filled and return an empty `GET /events`; clear them.
- Deleting an event that has bookings cascades to the bookings.
- Editing an event is reflected in the embedded event of existing bookings.

## Structure

| Folder | Purpose |
| --- | --- |
| `tests/ui`, `tests/api` | Specs, one Playwright project each |
| `page_objects/` | Locators and user actions per page and component |
| `data/selectorAlias/` | Selector strings and routes, one file per page object |
| `common_steps/` | Reusable multi-page flows (open event, book tickets...) |
| `api/` | Typed API client: `EventsApi`, `BookingsApi`, facade `EventHubApi` |
| `fixtures/` | Auth, API, cleanup and page fixtures |
| `config/`, `auth/`, `utils/` | Environment, accounts, test data builders |

