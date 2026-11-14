import type { Page, Locator} from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import type { EventCardCriteria } from './components/EventCard';
import { EventCard } from './components/EventCard';
import S from '../data/selectorAlias/EventsPage';
import type { BoundSection } from '../utils/selectorDefinition';
import { bindSelectors } from '../utils/selectorDefinition';

/**
 * Event listing "/events" with search and filters.
 * Filters and search are reflected in the URL (?category=…&city=…&search=…). Each filter method
 * waits for the URL to update before returning: changing a second filter before the first one
 * is applied can overwrite it.
 */
export class EventsPage extends BasePage {
  protected readonly path = S.props.path;
  private readonly ui: BoundSection<typeof S>;
  /** Static data: the filter options. */
  readonly props = S.props;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly cityFilter: Locator;
  readonly eventCards: Locator;
  readonly addNewEventButton: Locator;
  /** "No events found" empty state. */
  readonly noEventsMessage: Locator;
  readonly clearFiltersButton: Locator;

  constructor(page: Page) {
    super(page);
    this.ui = bindSelectors(page, S);
    const { elements, sections } = this.ui;
    this.heading = elements.heading;
    this.searchInput = elements.searchInput;
    this.categoryFilter = sections.categoryFilter.root;
    this.cityFilter = sections.cityFilter.root;
    this.eventCards = elements.eventCards;
    this.addNewEventButton = elements.addNewEventButton;
    this.noEventsMessage = elements.noEventsMessage;
    this.clearFiltersButton = elements.clearFiltersButton;
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  eventCard(title: string): EventCard {
    return new EventCard(this.ui.element('eventCardByTitle', { title }));
  }

  /** First card with a "Featured" badge (respects the current filters). */
  firstFeaturedEventCard(): EventCard {
    return new EventCard(this.ui.elements.featuredEventCards.first());
  }

  /** All cards currently shown (may be empty when nothing matches). */
  async allEventCards(): Promise<EventCard[]> {
    await this.waitForResults();
    return EventCard.all(this.eventCards);
  }

  /** Loops through the shown cards and returns the first match. */
  async findEventCard(criteria: EventCardCriteria): Promise<EventCard> {
    await this.waitForResults();
    return EventCard.find(this.eventCards, criteria, 'events page');
  }

  /** Waits until either cards or the "No events found" message are shown. */
  async waitForResults(): Promise<void> {
    await expect(this.eventCards.first().or(this.noEventsMessage)).toBeVisible();
  }

  // ---- filters --------------------------------------------------------------

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
    await this.expectUrlParam('search', text);
    await this.waitForResults();
  }

  /** e.g. filterByCategory('Concert') — matches the option text without its emoji. */
  async filterByCategory(category: string): Promise<void> {
    const option = await this.ui.sections.categoryFilter.element('optionByName', { category }).innerText();
    await this.categoryFilter.selectOption({ label: option });
    await this.expectUrlParam('category', category);
    await this.waitForResults();
  }

  async filterByCity(city: string): Promise<void> {
    await this.cityFilter.selectOption({ label: city });
    await this.expectUrlParam('city', city);
    await this.waitForResults();
  }

  /** Clicks "Clear filters" (shown with the empty state) and waits for the plain /events URL. */
  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
    await expect(this.page).toHaveURL(/\/events$/);
    await this.waitForResults();
  }

  /**
   * Assertion for filter/search results that does not depend on live data: either every shown
   * card passes `check`, or there are no cards and the "No events found" empty state is shown.
   */
  async assertEveryCardOrEmptyState(describe: string, check: (card: EventCard) => Promise<void>): Promise<void> {
    const cards = await this.allEventCards();
    if (cards.length === 0) {
      await expect(this.noEventsMessage, `no ${describe}: empty state is shown`).toBeVisible();
      await expect(this.clearFiltersButton).toBeVisible();
      return;
    }
    await expect(this.noEventsMessage).toBeHidden();
    await Promise.all(cards.map((card) => check(card)));
  }

  /** Opens the event details page via the card's "Book Now" link. */
  async openEvent(title: string): Promise<void> {
    await this.eventCard(title).bookNow();
  }

  private async expectUrlParam(name: string, value: string): Promise<void> {
    await expect
      .poll(() => new URL(this.page.url()).searchParams.get(name), { message: `URL ?${name}=${value}` })
      .toBe(value);
  }
}
