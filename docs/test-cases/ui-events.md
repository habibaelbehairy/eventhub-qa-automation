# UI Test Cases — Events page (search, filters, booking entry point)

| Item         | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Story        | US-114 — Book tickets for an event (second entry point to the booking) |
| Page         | https://eventhub.rahulshettyacademy.com/events                        |
| Automated in | `tests/ui/events/filterEvents.spec.ts`, `tests/ui/booking/bookFromEventsPage.spec.ts` |
| Test data    | Read-only for filters (nothing created). Booking tests book 1 ticket on a demo event and delete it afterwards. |

Assertions do not depend on which events exist: every shown card must match the filter, or the
"No events found" empty state (with "Clear filters") must be shown.

## Filters and search — `filterEvents.spec.ts`

| ID        | Test case                                   | Steps                                          | Expected |
| --------- | ------------------------------------------- | ---------------------------------------------- | -------- |
| TC-EV-01  | Category filter (Conference, Concert, Sports, Workshop, Festival — one run each) | Select the category | Every card's category badge is that category, or "No events found" + "Clear filters" are shown. URL has `?category=<name>`. |
| TC-EV-02  | City filter (Mumbai, Bangalore, Delhi, Hyderabad, Chennai, Pune — one run each) | Select the city | Every card's location ends with that city, or the empty state is shown. URL has `?city=<name>`. |
| TC-EV-03  | Category + city combined (Festival+Delhi, Concert+Delhi) | Select category, then city | Every card matches both; Concert+Delhi currently shows the empty state. |
| TC-EV-04  | Search by title                             | Type the title of a listed event               | That event's card is shown. |
| TC-EV-05  | Search with no match                        | Type text that matches nothing                 | No cards; "No events found" is shown. |
| TC-EV-06  | Clear filters                               | From the empty state click "Clear filters"     | All events are back; category, city and search are reset. |

## Booking from the Events page — `bookFromEventsPage.spec.ts`

| ID        | Test case                                   | Steps                                          | Expected |
| --------- | ------------------------------------------- | ---------------------------------------------- | -------- |
| TC-EV-07  | Book 1 ticket after filtering (Concert, Conference, Festival — one run each) | Events → filter category → pick a card with seats → Book Now → book 1 ticket | Details page shows the card's title, category and price; confirmation shows a reference, the customer, 1 ticket and total = price. |

The detailed card ↔ details checks (date, time, venue, city, seats, form defaults) are covered once,
on the Home entry point, in `bookFeaturedEventTicket.spec.ts`.

## Observations for the story review

| Observation | Impact |
| ----------- | ------ |
| The demo concert's city is "Los Angeles", which is not an option in the city filter. | That event cannot be found by city. |
| Same event: venue "Dome, NSCI SVP Stadium, Worli" and description "under the open Mumbai sky", but city "Los Angeles". | Inconsistent event data. |
| Changing a second filter very quickly after the first can drop the first one from the URL. | Possible lost filter for fast users; tests wait for the URL after each change. |
| Search also matches the description (e.g. "Tech" finds the concert via "pyrotechnics"), which is not visible on the card. | Results can look unrelated to the search text. |
| Sports and Workshop are filter options but have no events. | Empty state is reachable from the default filter options. |
