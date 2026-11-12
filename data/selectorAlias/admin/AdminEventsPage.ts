import { defineSelectors } from '../../../utils/selectorDefinition';

export default defineSelectors({
  selector: 'main',
  props: {
    path: '/admin/events',
    // Each user can own at most 6 events; adding a 7th silently replaces the oldest.
    maxOwnEvents: 6,
    // Validation messages of the "+ New Event" form, in form order.
    messages: {
      title: 'Title is required',
      city: 'City is required',
      venue: 'Venue is required',
      dateTime: 'Event date is required',
      price: 'Enter a valid price (≥ 0)',
      totalSeats: 'Must have at least 1 seat',
    },
    // Static text of the "+ New Event" form.
    formContent: {
      labels: {
        title: 'Title*',
        city: 'City*',
        venue: 'Venue*',
        dateTime: 'Event Date & Time*',
        price: 'Price ($)*',
        totalSeats: 'Total Seats*',
      },
      addButton: '+ Add Event',
    },
  },
  elements: {
    // One red message under a field of the form, by its text.
    validationError: 'form p.text-red-600:text-is("{message}")',
    newEventHeading: 'role=heading[name="+ New Event"s]',
    // The heading carries an emoji ("✏️ Edit Event"), so match by contained text.
    editEventHeading: 'role=heading[name=/Edit Event/]',
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
    // Shown instead of "+ Add Event" while an event is being edited (the label starts with an emoji).
    updateEventButton: 'role=button[name=/Update Event/]',
    cancelEditButton: 'role=button[name="Cancel edit"s]',
    // Red messages under the fields of the form.
    formErrors: 'form p.text-red-600',
    allEventsHeading: 'role=heading[name="All Events"s]',
    // "N total" next to the "All Events" heading.
    totalCount: 'text=/^[0-9]+ total$/',
  },
  sections: {
    eventsTable: {
      selector: 'table',
      props: {
        // Column order of the table cells.
        columns: ['title', 'category', 'city', 'date', 'price', 'seats', 'actions'],
      },
      elements: {
        rows: 'tbody tr',
        rowByTitle: 'tbody tr:has(td:has-text("{title}"))',
        cells: 'td',
        // Used inside a row. Static demo events show "Read-only" instead.
        editButton: 'role=button[name="Edit"s]',
        deleteButton: 'role=button[name="Delete"s]',
        readOnlyLabel: 'text="Read-only"',
      },
    },
  },
});
