import { test, expect } from '../../../fixtures';
import { openEventFromHome } from '../../../common_steps/openEventFromHome';

/**
 * Edge cases — booking form content and field validation (UI only).
 * Each test starts with a fresh logged-in browser context from the auth fixture and opens the
 * event page explicitly; the form is reset by clearing the fields instead of reloading the page.
 * No booking is ever created: each test fills only the field under test, the other required
 * fields stay empty, so Confirm Booking is always blocked by validation.
 */
test.describe('Booking form content and validation', { tag: ['@ui', '@edge'] }, () => {
  test.beforeEach(async ({ page, eventDetailsPage: detailsPage }) => {
    await openEventFromHome(page, { minSeats: 1 });
    await detailsPage.clearFieldValue('name');
    await detailsPage.clearFieldValue('email');
    await detailsPage.clearFieldValue('phone');
  });

  // ------------------------------------------------------------------ Form content
  test('Verify form shows labels, placeholders, per-ticket price and the Confirm button', async ({ eventDetailsPage: detailsPage }) => {
    const content = detailsPage.props.formContent;

    await expect(detailsPage.formPrice).toHaveText(/^\$[\d,]+(\.\d{2})?$/);
    await expect(detailsPage.perTicketText).toHaveText(content.perTicket);
    for (const field of ['name', 'email', 'phone'] as const) {
      await expect(detailsPage.fieldInput(field)).toHaveAccessibleName(content.labels[field]);
      await expect(detailsPage.fieldInput(field)).toHaveAttribute('placeholder', content.placeholders[field]);
      await expect(detailsPage.fieldInput(field)).toBeEmpty();
    }
    await expect(detailsPage.confirmBookingButton).toHaveText(content.confirmButton);
    await expect(detailsPage.confirmBookingButton).toBeEnabled();
  });

  // ------------------------------------------------------------------ Empty form
  test('Verify all three errors are shown and no booking is made when the form is empty', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.submitForm();
    await detailsPage.assertInlineError('name');
    await detailsPage.assertInlineError('email');
    await detailsPage.assertInlineError('phone');
    await detailsPage.assertNoBookingCreated();
  });

  // ------------------------------------------------------------------ Name
  test('Verify name error is shown when the name has less than 2 characters', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.setFieldValue('name', 'A');
    await detailsPage.submitForm();
    await detailsPage.assertInlineError('name');
    await detailsPage.assertNoBookingCreated();
    await detailsPage.clearFieldValue('name');
  });

  test('Verify name error is shown when the name is only spaces', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.setFieldValue('name', '   ');
    await detailsPage.submitForm();
    await detailsPage.assertInlineError('name');
    await detailsPage.assertNoBookingCreated();
    await detailsPage.clearFieldValue('name');
  });

  test('Verify name is accepted with an apostrophe and a hyphen', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.setFieldValue('name', "O'Brien-Smith");
    await detailsPage.submitForm();
    await detailsPage.assertNoInlineError('name');
  });

  // ------------------------------------------------------------------ Email
  test('Verify email error is shown when the email has no @', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.setFieldValue('email', 'plainaddress');
    await detailsPage.submitForm();
    await detailsPage.assertInlineError('email');
    await detailsPage.assertNoBookingCreated();
  });

  test('Verify email error is shown when the email has no domain', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.setFieldValue('email', 'user@');
    await detailsPage.submitForm();
    await detailsPage.assertInlineError('email');
    await detailsPage.assertNoBookingCreated();
    await detailsPage.clearFieldValue('email');
  });

  test('Verify email error is shown when the email has no name before @', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.setFieldValue('email', '@example.com');
    await detailsPage.submitForm();
    await detailsPage.assertInlineError('email');
    await detailsPage.assertNoBookingCreated();
    await detailsPage.clearFieldValue('email');
  });

  test('Verify email error is shown when the email contains a space', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.setFieldValue('email', 'user name@example.com');
    await detailsPage.submitForm();
    await detailsPage.assertInlineError('email');
    await detailsPage.assertNoBookingCreated();
    await detailsPage.clearFieldValue('email');
  });

  test('Verify a valid email is accepted', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.setFieldValue('email', 'user@example.com');
    await detailsPage.submitForm();
    await detailsPage.assertNoInlineError('email');
  });

  // ------------------------------------------------------------------ Phone
  test('Verify phone error is shown when the phone has 9 digits', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.setFieldValue('phone', '987654321');
    await detailsPage.submitForm();
    await detailsPage.assertInlineError('phone');
    await detailsPage.assertNoBookingCreated();
    await detailsPage.clearFieldValue('phone');
  });

  test('Verify phone error is shown when the phone contains letters', async ({ eventDetailsPage: detailsPage }) => {
    await detailsPage.setFieldValue('phone', 'abcdefghij');
    await detailsPage.submitForm();
    await detailsPage.assertInlineError('phone');
    await detailsPage.assertNoBookingCreated();
    await detailsPage.clearFieldValue('phone');
  });

  test('Verify phone is accepted in the placeholder format "+91 98765 43210"', async ({ eventDetailsPage: detailsPage }) => {
    // The field's own example; if it is rejected, the form refuses its own placeholder.
    await detailsPage.setFieldValue('phone', '+91 98765 43210');
    await detailsPage.submitForm();
    await detailsPage.assertNoInlineError('phone');
  });
});
