import type { Page, Locator } from '@playwright/test';
import S from '../../data/selectorAlias/components/DeleteEventDialog';
import { bindSelectors } from '../../utils/selectorDefinition';

/** "Delete this event?" confirmation modal on Admin > Manage Events. */
export class DeleteEventDialog {
  readonly root: Locator;
  readonly heading: Locator;
  /** "This will permanently delete the event and all associated bookings. ..." */
  readonly message: Locator;
  readonly confirmButton: Locator;
  /** The "Cancel" button closes the dialog and KEEPS the event. */
  readonly keepEventButton: Locator;

  constructor(page: Page) {
    const { root, elements } = bindSelectors(page, S);
    this.root = root;
    this.heading = elements.heading;
    this.message = elements.message;
    this.confirmButton = elements.confirmButton;
    this.keepEventButton = elements.keepEventButton;
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async dismiss(): Promise<void> {
    await this.keepEventButton.click();
  }
}
