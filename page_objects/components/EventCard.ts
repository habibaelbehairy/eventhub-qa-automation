import type { Locator } from '@playwright/test';
import S from '../../data/selectorAlias/components/EventCard';
import { bindSelectors } from '../../utils/selectorDefinition';
import { parseMoney, parseIntFrom } from '../../utils/parse';

/** Criteria for picking a card while looping through a list of event cards. */
export interface EventCardCriteria {
  /** Exact event title. */
  title?: string;
  /** Category badge text, e.g. 'Concert' (any category if omitted). */
  category?: string;
  /** Must (true) / must not (false) have the "Featured" badge. */
  featured?: boolean;
  /** At least this many seats available. */
  minSeats?: number;
  /** At most this many seats available. */
  maxSeats?: number;
}

/** An event tile (data-testid="event-card") on the Home and Events pages. */
export class EventCard {
  readonly root: Locator;
  /** "Concert", "Festival", ... */
  readonly categoryBadge: Locator;
  /** Only on static demo events. */
  readonly featuredBadge: Locator;
  readonly title: Locator;
  /** "Sat, 11 Jul" */
  readonly date: Locator;
  /** "<venue>, <city>" */
  readonly location: Locator;
  readonly price: Locator;
  /** "366 seats available" or "8 seats left!" */
  readonly seats: Locator;
  readonly bookNowLink: Locator;

  constructor(root: Locator) {
    const { elements } = bindSelectors(root, S);
    this.root = root;
    this.categoryBadge = elements.categoryBadge;
    this.featuredBadge = elements.featuredBadge;
    this.title = elements.title;
    this.date = elements.date;
    this.location = elements.location;
    this.price = elements.price;
    this.seats = elements.seats;
    this.bookNowLink = elements.bookNowLink;
  }

  async priceValue(): Promise<number> {
    return parseMoney(await this.price.innerText());
  }

  async seatsValue(): Promise<number> {
    return parseIntFrom(await this.seats.innerText());
  }

  async bookNow(): Promise<void> {
    await this.bookNowLink.click();
  }

  async categoryText(): Promise<string> {
    return (await this.categoryBadge.innerText()).trim();
  }

  /** City = last part of "<venue>, <city>". */
  async cityText(): Promise<string> {
    return (await this.location.innerText()).split(',').pop()!.trim();
  }

  async matches(criteria: EventCardCriteria): Promise<boolean> {
    if (criteria.title !== undefined && (await this.title.innerText()).trim() !== criteria.title) return false;
    if (criteria.category !== undefined && (await this.categoryText()) !== criteria.category) return false;
    if (criteria.featured !== undefined && (await this.featuredBadge.isVisible()) !== criteria.featured) return false;
    if (criteria.minSeats !== undefined && (await this.seatsValue()) < criteria.minSeats) return false;
    if (criteria.maxSeats !== undefined && (await this.seatsValue()) > criteria.maxSeats) return false;
    return true;
  }

  // ---- working with a list of cards (Home page, Events page) --------------

  /** Wraps every card currently matched by `cards` (in page order). */
  static async all(cards: Locator): Promise<EventCard[]> {
    return (await cards.all()).map((card) => new EventCard(card));
  }

  /** Loops through the cards like a user scanning the page and returns the first match. */
  static async find(cards: Locator, criteria: EventCardCriteria, pageName: string): Promise<EventCard> {
    const list = await EventCard.all(cards);
    for (const card of list) {
      if (await card.matches(criteria)) return card;
    }
    throw new Error(`No card matching ${JSON.stringify(criteria)} among ${list.length} cards on the ${pageName}`);
  }
}
