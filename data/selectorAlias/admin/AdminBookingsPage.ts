import { defineSelectors } from '../../../utils/selectorDefinition';

export default defineSelectors({
  selector: 'main',
  props: {
    path: '/admin/bookings',
  },
  elements: {
    heading: 'role=heading[name="Manage Bookings"s]',
    totalCount: 'text=/[0-9]+ total bookings?/',
    statusFilter: 'select:has(option:text-is("All Statuses"))',
  },
  sections: {
    bookingsTable: {
      selector: 'table',
      elements: {
        rows: 'tbody tr',
        rowByRef: 'tbody tr:has(td:has-text("{ref}"))',
        // Used inside a row.
        viewButton: 'role=button[name="View"s]',
        cancelButton: 'role=button[name="Cancel"s]',
      },
    },
  },
});
