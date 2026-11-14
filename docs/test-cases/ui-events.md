# UI Test Cases — Events page (booking entry point)

| Item         | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Story        | US-114 — Book tickets for an event (second entry point to the booking) |
| Page         | https://eventhub.rahulshettyacademy.com/events                        |
| Automated in | `tests/ui/booking/bookFromEventsPage.spec.ts` |
| Test data    | Booking tests book 1 ticket on a demo event; the cleanup fixture deletes the booking through the API afterwards. |

## Booking from the Events page — `bookFromEventsPage.spec.ts`

| ID        | Test case                                   | Steps                                          | Expected |
| --------- | ------------------------------------------- | ---------------------------------------------- | -------- |
| TC-EV-01  | Book 1 ticket after filtering (Concert, Conference, Festival — one run each) | Events → filter category → pick a card with seats → Book Now → book 1 ticket | Details page shows the card's title, category and price; confirmation shows a reference, the customer, 1 ticket and total = price. |

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
