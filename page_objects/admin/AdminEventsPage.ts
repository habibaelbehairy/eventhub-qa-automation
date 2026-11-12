import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import S from '../../data/selectorAlias/admin/AdminEventsPage';
import { bindSelectors, BoundSection } from '../../utils/selectorDefinition';

export interface EventFormData {
  title: string;
  description?: string;
  category: 'Conference' | 'Concert' | 'Sports' | 'Workshop' | 'Festival';
  city: string;
  venue: string;
  /** Local date & time in the input's format: 'YYYY-MM-DDTHH:mm' */
  dateTime: string;
  price: number;
  totalSeats: number;
  imageUrl?: string;
}

/**
 * Admin > Manage Events "/admin/events" — "+ New Event" form and "All Events" table.
 * Note: each user can have at most 6 own events; adding a 7th silently replaces the oldest.
 */
export class AdminEventsPage extends BasePage {
  protected readonly path = S.props.path;
  private readonly ui: BoundSection<typeof S>;
  readonly newEventHeading: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly categorySelect: Locator;
  readonly cityInput: Locator;
  readonly venueInput: Locator;
  readonly dateTimeInput: Locator;
  readonly priceInput: Locator;
  readonly totalSeatsInput: Locator;
  readonly imageUrlInput: Locator;
  readonly addEventButton: Locator;
  readonly allEventsHeading: Locator;
  readonly eventRows: Locator;

  constructor(page: Page) {
    super(page);
    this.ui = bindSelectors(page, S);
    const { elements, sections } = this.ui;
    this.newEventHeading = elements.newEventHeading;
    this.titleInput = elements.titleInput;
    this.descriptionInput = elements.descriptionInput;
    this.categorySelect = elements.categorySelect;
    this.cityInput = elements.cityInput;
    this.venueInput = elements.venueInput;
    this.dateTimeInput = elements.dateTimeInput;
    this.priceInput = elements.priceInput;
    this.totalSeatsInput = elements.totalSeatsInput;
    this.imageUrlInput = elements.imageUrlInput;
    this.addEventButton = elements.addEventButton;
    this.allEventsHeading = elements.allEventsHeading;
    this.eventRows = sections.eventsTable.elements.rows;
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.newEventHeading).toBeVisible();
  }

  async fillEventForm(event: EventFormData): Promise<void> {
    await this.titleInput.fill(event.title);
    if (event.description) await this.descriptionInput.fill(event.description);
    await this.categorySelect.selectOption(event.category);
    await this.cityInput.fill(event.city);
    await this.venueInput.fill(event.venue);
    await this.dateTimeInput.fill(event.dateTime);
    await this.priceInput.fill(String(event.price));
    await this.totalSeatsInput.fill(String(event.totalSeats));
    if (event.imageUrl) await this.imageUrlInput.fill(event.imageUrl);
  }

  async addEvent(event: EventFormData): Promise<void> {
    await this.fillEventForm(event);
    await this.addEventButton.click();
  }

  /** Table row for an event title. Static demo events show "Read-only" instead of Edit/Delete. */
  eventRow(title: string): Locator {
    return this.ui.sections.eventsTable.element('rowByTitle', { title });
  }

  editButton(title: string): Locator {
    return this.eventRow(title).locator(S.sections.eventsTable.elements.editButton);
  }

  deleteButton(title: string): Locator {
    return this.eventRow(title).locator(S.sections.eventsTable.elements.deleteButton);
  }
}
