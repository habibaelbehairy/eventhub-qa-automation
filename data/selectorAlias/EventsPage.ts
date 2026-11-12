import { defineSelectors } from '../../utils/selectorDefinition';

export default defineSelectors({
  selector: 'main',
  props: {
    path: '/events',
  },
  elements: {
    heading: 'role=heading[name="Upcoming Events"s]',
    searchInput: 'role=textbox[name="Search events, venues…"s]',
    eventCards: '[data-testid="event-card"]',
    eventCardByTitle: '[data-testid="event-card"]:has(h3:text-is("{title}"))',
    featuredEventCards: '[data-testid="event-card"]:has(span:text-is("Featured"))',
    addNewEventButton: 'role=button[name="Add New Event"s]',
  },
  sections: {
    // The filters have no labels; they are identified by their default option.
    categoryFilter: {
      selector: 'select:has(option:text-is("All Categories"))',
      elements: {
        // Options carry an emoji ("🎵 Concert"), so match by contained text.
        optionByName: 'option:has-text("{category}")',
      },
    },
    cityFilter: {
      selector: 'select:has(option:text-is("All Cities"))',
    },
  },
});
