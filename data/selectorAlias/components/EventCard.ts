import { defineSelectors } from '../../../utils/selectorDefinition';

// Root is the card itself (data-testid="event-card"), given by the page that owns the card.
export default defineSelectors({
  elements: {
    // Badges on the image: category top-left, "Featured" top-right (static demo events only).
    categoryBadge: 'div.left-3 > span',
    featuredBadge: 'span:text-is("Featured")',
    title: 'h3',
    // Rows under the title: 1st = date ("Sat, 11 Jul"), 2nd = location ("<venue>, <city>").
    date: 'h3 >> xpath=../following-sibling::div[1]/div[1]/span',
    location: 'h3 >> xpath=../following-sibling::div[1]/div[2]/span',
    price: 'p:has-text("$")',
    seats: 'text=/seats? (available|left)/',
    bookNowLink: '[data-testid="book-now-btn"]',
  },
});
