import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { EventCard, EventCardCriteria } from './components/EventCard';
import S from '../data/selectorAlias/HomePage';
import { bindSelectors, BoundSection } from '../utils/selectorDefinition';

/** Landing page "/" (shown after login). */
export class HomePage extends BasePage {
  protected readonly path = S.props.path;
  private readonly ui: BoundSection<typeof S>;
  readonly heading: Locator;
  readonly browseEventsLink: Locator;
  readonly featuredEventsHeading: Locator;
  readonly viewAllEventsLink: Locator;
  readonly eventCards: Locator;

  constructor(page: Page) {
    super(page);
    this.ui = bindSelectors(page, S);
    const { elements } = this.ui;
    this.heading = elements.heading;
    this.browseEventsLink = elements.browseEventsLink;
    this.featuredEventsHeading = elements.featuredEventsHeading;
    this.viewAllEventsLink = elements.viewAllEventsLink;
    this.eventCards = elements.eventCards;
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  eventCard(title: string): EventCard {
    return new EventCard(this.ui.element('eventCardByTitle', { title }));
  }

  /** All event cards currently shown, in page order. */
  async allEventCards(): Promise<EventCard[]> {
    await expect(this.eventCards.first()).toBeVisible();
    return EventCard.all(this.eventCards);
  }

  /**
   * Loops through the cards and returns the first one matching the category and options
   * (featured, minSeats). Any category if `category` is omitted.
   */
  async findEventCard(category?: string, options: Omit<EventCardCriteria, 'category'> = {}): Promise<EventCard> {
    await expect(this.eventCards.first()).toBeVisible();
    return EventCard.find(this.eventCards, { category, ...options }, 'home page');
  }

  async browseEvents(): Promise<void> {
    await this.browseEventsLink.click();
  }
}
