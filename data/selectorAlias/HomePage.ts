import { defineSelectors } from '../../utils/selectorDefinition';

export default defineSelectors({
  selector: 'main',
  props: {
    path: '/',
  },
  elements: {
    heading: 'role=heading[name="Discover & Book Amazing Events"s]',
    browseEventsLink: 'role=link[name="Browse Events →"s]',
    featuredEventsHeading: 'role=heading[name="Featured Events"s]',
    viewAllEventsLink: 'role=link[name="View all →"s]',
    eventCards: '[data-testid="event-card"]',
    eventCardByTitle: '[data-testid="event-card"]:has(h3:text-is("{title}"))',
  },
});
