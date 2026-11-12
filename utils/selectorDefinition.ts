import { Page, Locator } from '@playwright/test';
import { withParams } from './selectors';

/**
 * Nightwatch-style selector definition:
 *   selector -> root of this page/section; elements and sections are searched INSIDE it
 *   elements -> named selector strings (may contain {placeholders})
 *   sections -> nested definitions with their own selector/elements/sections
 *   props    -> static data that belongs to the page (expected texts, limits, ...)
 */
export interface SelectorDefinition {
  selector?: string;
  props?: Record<string, unknown>;
  elements?: Record<string, string>;
  sections?: Record<string, SelectorDefinition>;
}

/** Identity function that keeps the literal keys, so typos in element/section names fail at compile time. */
export function defineSelectors<const T extends SelectorDefinition>(definition: T): T {
  return definition;
}

type ElementsOf<T> = T extends { elements: infer E } ? E : {};
type SectionsOf<T> = T extends { sections: infer S } ? S : {};
type PropsOf<T> = T extends { props: infer P } ? P : {};

/** A definition turned into Playwright locators. */
export interface BoundSection<T extends SelectorDefinition> {
  /** Locator of `selector` (or the parent scope if the definition has no selector). */
  root: Locator;
  props: PropsOf<T>;
  elements: { [K in keyof ElementsOf<T>]: Locator };
  sections: { [K in keyof SectionsOf<T>]: SectionsOf<T>[K] extends SelectorDefinition ? BoundSection<SectionsOf<T>[K]> : never };
  /** Element with {placeholders} filled in, e.g. element('bookingCardByRef', { ref: 'C-AB12CD' }). */
  element(name: keyof ElementsOf<T> & string, params?: Record<string, string | number>): Locator;
}

/** Builds scoped locators for a definition, starting from a page or from a parent locator. */
export function bindSelectors<T extends SelectorDefinition>(scope: Page | Locator, definition: T): BoundSection<T> {
  const base: Locator = 'goto' in scope ? scope.locator('html') : scope;
  const root = definition.selector ? base.locator(definition.selector) : base;
  const elementSelectors = definition.elements ?? {};

  const elements = Object.fromEntries(
    Object.entries(elementSelectors).map(([name, selector]) => [name, root.locator(selector)]),
  );
  const sections = Object.fromEntries(
    Object.entries(definition.sections ?? {}).map(([name, section]) => [name, bindSelectors(root, section)]),
  );

  return {
    root,
    props: definition.props ?? {},
    elements,
    sections,
    element(name: string, params: Record<string, string | number> = {}) {
      const selector = elementSelectors[name];
      if (!selector) throw new Error(`Unknown element "${name}"`);
      return root.locator(withParams(selector, params));
    },
  } as BoundSection<T>;
}
