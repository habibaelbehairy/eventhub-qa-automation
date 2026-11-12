import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { EventCard } from './components/EventCard';
import S from '../data/selectorAlias/EventsPage';
import { bindSelectors, BoundSection } from '../utils/selectorDefinition';

/** Event listing "/events" with search and filters. */
export class EventsPage extends BasePage {
  protected readonly path = S.props.path;
  private readonly ui: BoundSection<typeof S>;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly cityFilter: Locator;
  readonly eventCards: Locator;
  readonly addNewEventButton: Locator;

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

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  /** e.g. filterByCategory('Concert') — matches the option text without its emoji. */
  async filterByCategory(category: string): Promise<void> {
    const option = await this.ui.sections.categoryFilter.element('optionByName', { category }).innerText();
    await this.categoryFilter.selectOption({ label: option });
  }

  async filterByCity(city: string): Promise<void> {
    await this.cityFilter.selectOption({ label: city });
  }

  /** Opens the event details page via the card's "Book Now" link. */
  async openEvent(title: string): Promise<void> {
    await this.eventCard(title).bookNow();
  }
}
