import { Locator } from '@playwright/test';
import S from '../../data/selectorAlias/components/EventCard';
import { bindSelectors } from '../../utils/selectorDefinition';
import { parseMoney, parseIntFrom } from '../../utils/parse';

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
}
