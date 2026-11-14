import type { Page, Locator} from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import S from '../../data/selectorAlias/admin/AdminBookingsPage';
import type { BoundSection } from '../../utils/selectorDefinition';
import { bindSelectors } from '../../utils/selectorDefinition';

/** Admin > Manage Bookings "/admin/bookings" — table of bookings with a status filter. */
export class AdminBookingsPage extends BasePage {
  protected readonly path = S.props.path;
  private readonly ui: BoundSection<typeof S>;
  readonly heading: Locator;
  /** "N total bookings" */
  readonly totalCount: Locator;
  readonly statusFilter: Locator;
  readonly bookingRows: Locator;

  constructor(page: Page) {
    super(page);
    this.ui = bindSelectors(page, S);
    const { elements, sections } = this.ui;
    this.heading = elements.heading;
    this.totalCount = elements.totalCount;
    this.statusFilter = elements.statusFilter;
    this.bookingRows = sections.bookingsTable.elements.rows;
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async filterByStatus(status: 'All Statuses' | 'Confirmed' | 'Cancelled'): Promise<void> {
    await this.statusFilter.selectOption({ label: status });
  }

  /** Row for a booking reference (first column). */
  bookingRow(bookingRef: string): Locator {
    return this.ui.sections.bookingsTable.element('rowByRef', { ref: bookingRef });
  }

  viewButton(bookingRef: string): Locator {
    return this.bookingRow(bookingRef).locator(S.sections.bookingsTable.elements.viewButton);
  }

  cancelButton(bookingRef: string): Locator {
    return this.bookingRow(bookingRef).locator(S.sections.bookingsTable.elements.cancelButton);
  }
}
