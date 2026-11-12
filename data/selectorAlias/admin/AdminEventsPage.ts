import { defineSelectors } from '../../../utils/selectorDefinition';

export default defineSelectors({
  selector: 'main',
  props: {
    path: '/admin/events',
    // Each user can own at most 6 events; adding a 7th silently replaces the oldest.
    maxOwnEvents: 6,
  },
  elements: {
    newEventHeading: 'role=heading[name="+ New Event"s]',
    titleInput: 'role=textbox[name="Title*"s]',
    descriptionInput: 'role=textbox[name="Describe the event…"s]',
    categorySelect: 'role=combobox[name="Category*"s]',
    cityInput: 'role=textbox[name="City*"s]',
    venueInput: 'role=textbox[name="Venue*"s]',
    dateTimeInput: 'role=textbox[name="Event Date & Time*"s]',
    priceInput: 'role=spinbutton[name="Price ($)*"s]',
    totalSeatsInput: 'role=spinbutton[name="Total Seats*"s]',
    imageUrlInput: 'role=textbox[name="Image URL (optional)"s]',
    addEventButton: 'role=button[name="+ Add Event"s]',
    allEventsHeading: 'role=heading[name="All Events"s]',
  },
  sections: {
    eventsTable: {
      selector: 'table',
      elements: {
        rows: 'tbody tr',
        rowByTitle: 'tbody tr:has(td:has-text("{title}"))',
        // Used inside a row. Static demo events show "Read-only" instead.
        editButton: 'role=button[name="Edit"s]',
        deleteButton: 'role=button[name="Delete"s]',
      },
    },
  },
});
