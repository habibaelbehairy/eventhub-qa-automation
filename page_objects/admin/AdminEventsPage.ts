import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import S from '../../data/selectorAlias/admin/AdminEventsPage';
import { bindSelectors, BoundSection } from '../../utils/selectorDefinition';
import { DeleteEventDialog } from '../components/DeleteEventDialog';
import { tableDate } from '../../utils/dates';

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

/** Required fields of the "+ New Event" form (they have validation messages). */
export type EventFormField = keyof typeof S.props.messages;

/**
 * Admin > Manage Events "/admin/events" — "+ New Event" form and "All Events" table.
 * Note: each user can have at most 6 own events; adding a 7th silently replaces the oldest.
 */
export class AdminEventsPage extends BasePage {
  protected readonly path = S.props.path;
  private readonly ui: BoundSection<typeof S>;
  /** Static data: validation messages and the 6-event limit. */
  readonly props = S.props;
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
  readonly editEventHeading: Locator;
  readonly updateEventButton: Locator;
  readonly cancelEditButton: Locator;
  readonly formErrors: Locator;
  readonly totalCount: Locator;
  /** Rows of the static demo events (they show "Read-only" instead of Edit / Delete). */
  readonly readOnlyRows: Locator;
  readonly deleteDialog: DeleteEventDialog;

  constructor(page: Page) {
    super(page);
    this.deleteDialog = new DeleteEventDialog(page);
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
    this.editEventHeading = elements.editEventHeading;
    this.updateEventButton = elements.updateEventButton;
    this.cancelEditButton = elements.cancelEditButton;
    this.formErrors = elements.formErrors;
    this.totalCount = elements.totalCount;
    this.readOnlyRows = sections.eventsTable.elements.rows.filter({
      has: page.locator(S.sections.eventsTable.elements.readOnlyLabel),
    });
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.newEventHeading).toBeVisible();
    // The table loads after the form; the demo events are always listed.
    await expect(this.readOnlyRows.first()).toBeVisible();
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

  /** Adds the event and asserts its row in the table shows what was entered. */
  async createEvent(event: EventFormData): Promise<void> {
    await this.addEvent(event);
    await expect(this.eventRow(event.title)).toBeVisible();
    await this.expectRow(event);
  }

  /** Number from the "N total" label next to the "All Events" heading. */
  async totalEvents(): Promise<number> {
    const text = (await this.totalCount.textContent()) ?? '';
    return Number.parseInt(text, 10);
  }

  /** One cell of an event's row, e.g. cell(title, 'price'). */
  cell(title: string, column: (typeof S.sections.eventsTable.props.columns)[number]): Locator {
    const index = S.sections.eventsTable.props.columns.indexOf(column);
    return this.eventRow(title).locator(S.sections.eventsTable.elements.cells).nth(index);
  }

  /** Asserts the row of an event shows what was entered in the form. */
  async expectRow(event: EventFormData, shown: { price?: string } = {}): Promise<void> {
    await expect(this.cell(event.title, 'category')).toContainText(event.category);
    await expect(this.cell(event.title, 'city')).toContainText(event.city);
    await expect(this.cell(event.title, 'date')).toContainText(tableDate(event.dateTime));
    await expect(this.cell(event.title, 'price')).toContainText(shown.price ?? `$${event.price}`);
    await expect(this.cell(event.title, 'seats')).toContainText(String(event.totalSeats));
  }

  // ---- form field helpers (used by the validation tests) -----------------

  private totalBeforeSubmit = 0;

  /** Validation message under a form field, by its text. */
  validationError(message: string): Locator {
    return this.ui.element('validationError', { message });
  }

  /** Input of a required form field. */
  fieldInput(field: EventFormField): Locator {
    return {
      title: this.titleInput,
      city: this.cityInput,
      venue: this.venueInput,
      dateTime: this.dateTimeInput,
      price: this.priceInput,
      totalSeats: this.totalSeatsInput,
    }[field];
  }

  async setFieldValue(field: EventFormField, value: string): Promise<void> {
    await this.fieldInput(field).fill(value);
  }

  /** Clears one of the form fields without reloading the page. */
  async clearFieldValue(field: EventFormField): Promise<void> {
    await this.fieldInput(field).fill('');
  }

  /** Clicks Add Event and waits until validation has run (at least one inline error shown). */
  async submitForm(): Promise<void> {
    this.totalBeforeSubmit = await this.totalEvents();
    await this.addEventButton.click();
    const messages = Object.values(this.props.messages).map((message) => this.validationError(message));
    await expect(messages.reduce((all, one) => all.or(one)).first()).toBeVisible();
  }

  /** The field's inline error (text from props.messages) is shown. */
  async assertInlineError(field: EventFormField): Promise<void> {
    await expect(this.validationError(this.props.messages[field]), `${field} inline error`).toBeVisible();
  }

  /** The field's inline error is NOT shown (call after submitForm so validation has run). */
  async assertNoInlineError(field: EventFormField): Promise<void> {
    await expect(this.validationError(this.props.messages[field]), `no ${field} inline error`).toBeHidden();
  }

  /** No event was created: the form is still there and the total did not change. */
  async assertNoEventCreated(): Promise<void> {
    await expect(this.addEventButton).toBeVisible();
    expect(await this.totalEvents(), 'events after the rejected submit').toBe(this.totalBeforeSubmit);
  }

  /** Asserts the form shows exactly these validation messages (and nothing else). */
  async expectErrors(messages: string[]): Promise<void> {
    await expect(this.formErrors).toHaveText(messages);
  }

  /** A demo event row offers neither Edit nor Delete. */
  async expectReadOnly(row: Locator): Promise<void> {
    const { editButton, deleteButton } = S.sections.eventsTable.elements;
    await expect(row.locator(editButton)).toHaveCount(0);
    await expect(row.locator(deleteButton)).toHaveCount(0);
  }

  async startEdit(title: string): Promise<void> {
    await this.editButton(title).click();
    await expect(this.editEventHeading).toBeVisible();
  }

  async updateEvent(): Promise<void> {
    await this.updateEventButton.click();
  }

  async cancelEdit(): Promise<void> {
    await this.cancelEditButton.click();
  }

  /** Opens the delete dialog and confirms it. */
  async deleteEvent(title: string): Promise<void> {
    await this.deleteButton(title).click();
    await expect(this.deleteDialog.root).toBeVisible();
    await this.deleteDialog.confirm();
    await expect(this.deleteDialog.root).toBeHidden();
  }

  /** Deletes every event the user owns, one by one (demo events have no Delete button). Returns how many. */
  async deleteAllOwnEvents(): Promise<number> {
    const deleteButtons = this.eventRows.locator(S.sections.eventsTable.elements.deleteButton);
    const total = await deleteButtons.count();
    for (let remaining = total; remaining > 0; remaining--) {
      await deleteButtons.first().click();
      await expect(this.deleteDialog.root).toBeVisible();
      await this.deleteDialog.confirm();
      await expect(this.deleteDialog.root).toBeHidden();
      await expect(deleteButtons).toHaveCount(remaining - 1);
    }
    return total;
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
