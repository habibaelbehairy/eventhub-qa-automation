import { defineSelectors } from '../../../utils/selectorDefinition';

export default defineSelectors({
  selector: 'role=dialog[name="Cancel this booking?"s]',
  elements: {
    heading: 'role=heading[name="Cancel this booking?"s]',
    // "This will cancel <ref> and release N seat(s) back to the event. ..."
    message: 'text=/This will cancel/',
    confirmButton: 'role=button[name="Yes, cancel it"s]',
    // Closes the dialog and KEEPS the booking.
    keepBookingButton: 'role=button[name="Cancel"s]',
    closeButton: 'role=button[name="Close"s]',
  },
});
