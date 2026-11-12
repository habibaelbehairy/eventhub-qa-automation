import { defineSelectors } from '../../../utils/selectorDefinition';

export default defineSelectors({
  selector: 'role=dialog[name="Delete this event?"s]',
  elements: {
    heading: 'role=heading[name="Delete this event?"s]',
    // "This will permanently delete the event and all associated bookings. This cannot be undone."
    message: 'p:has-text("permanently delete")',
    confirmButton: 'role=button[name="Delete event"s]',
    // Closes the dialog and KEEPS the event.
    keepEventButton: 'role=button[name="Cancel"s]',
  },
});
