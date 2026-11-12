import { defineSelectors } from '../../utils/selectorDefinition';

// The login page has no <main>, so elements are searched in the whole page (no root selector).
export default defineSelectors({
  props: {
    path: '/login',
  },
  elements: {
    heading: 'role=heading[name="Sign in to EventHub"s]',
    emailInput: 'role=textbox[name="Email"s]',
    passwordInput: 'role=textbox[name="Password"s]',
    signInButton: 'role=button[name="Sign In"s]',
    // In the top navigation once signed in.
    logoutButton: 'role=button[name="Logout"s]',
  },
});
