import { Page, Locator } from '@playwright/test';
import S from '../../data/selectorAlias/components/CancelBookingDialog';
import { bindSelectors } from '../../utils/selectorDefinition';

/** "Cancel this booking?" confirmation modal (My Bookings and Booking Details pages). */
export class CancelBookingDialog {
  readonly root: Locator;
  readonly heading: Locator;
  /** "This will cancel <ref> and release N seat(s) back to the event. ..." */
  readonly message: Locator;
  readonly confirmButton: Locator;
  /** The "Cancel" button closes the dialog and KEEPS the booking. */
  readonly keepBookingButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    const { root, elements } = bindSelectors(page, S);
    this.root = root;
    this.heading = elements.heading;
    this.message = elements.message;
    this.confirmButton = elements.confirmButton;
    this.keepBookingButton = elements.keepBookingButton;
    this.closeButton = elements.closeButton;
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async dismiss(): Promise<void> {
    await this.keepBookingButton.click();
  }
}
