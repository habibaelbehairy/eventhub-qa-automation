import { Page, Locator } from '@playwright/test';
import S from '../../data/selectorAlias/components/PageMessages';
import { bindSelectors, BoundSection } from '../../utils/selectorDefinition';

/** Messages shown anywhere on the page: inline errors, toasts, banners. */
export class PageMessages {
  private readonly ui: BoundSection<typeof S>;

  constructor(page: Page) {
    this.ui = bindSelectors(page, S);
  }

  /** Element whose whole text is exactly `text`. */
  withText(text: string): Locator {
    return this.ui.element('byText', { text });
  }

  /** Element that contains `text` (case-insensitive). */
  containing(text: string): Locator {
    return this.ui.element('byPartialText', { text });
  }
}
