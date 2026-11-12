import { defineSelectors } from '../../../utils/selectorDefinition';

export default defineSelectors({
  // First <nav> = site header (event pages also have a breadcrumb <nav> inside <main>).
  selector: 'role=navigation >> nth=0',
  elements: {
    homeLink: 'role=link[name="Home"s]',
    eventsLink: 'role=link[name="Events"s]',
    myBookingsLink: 'role=link[name="My Bookings"s]',
    adminMenuButton: 'role=button[name="Admin"s]',
    manageEventsLink: 'role=link[name="Manage Events"s]',
    manageBookingsLink: 'role=link[name="Manage Bookings"s]',
    logoutButton: 'role=button[name="Logout"s]',
    userEmail: 'text="{email}"',
  },
});
