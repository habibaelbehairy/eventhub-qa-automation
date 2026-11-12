import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { EventCard } from './components/EventCard';
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
    const cards = await this.eventCards.all();
    return cards.map((card) => new EventCard(card));
  }

  /**
   * Loops through the cards like a user scanning the page and returns the first one
   * with the given category badge (and, if asked, the "Featured" badge).
   */
  async findEventCard(category: string, options: { featured?: boolean } = {}): Promise<EventCard> {
    const cards = await this.allEventCards();
    for (const card of cards) {
      const cardCategory = (await card.categoryBadge.innerText()).trim();
      const isFeatured = await card.featuredBadge.isVisible();
      if (cardCategory === category && (options.featured === undefined || options.featured === isFeatured)) {
        return card;
      }
    }
    throw new Error(`No ${options.featured ? 'featured ' : ''}"${category}" card among ${cards.length} cards on the home page`);
  }

  async browseEvents(): Promise<void> {
    await this.browseEventsLink.click();
  }
}
