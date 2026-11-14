import { test, expect, cleanUpTestData } from '../../../fixtures';
import { openEventFromHome } from '../../../common_steps/openEventFromHome';

/**
 * Edge cases — booking form content and field validation (UI only).
 * The event page is opened once from Home; the fields are filled progressively, each test adding a
 * valid value or checking one invalid value, without navigating back to Home or reloading.
 * The invalid-input tests are blocked by validation and create no booking; the final test submits
 * the now-complete, valid form and checks the booking is confirmed.
 */
test.describe('Booking form content and validation', { tag: ['@ui', '@edge'] }, () => {
  test.afterAll(({ fileSession }) => cleanUpTestData(fileSession));

  test.beforeAll(async ({ page, eventDetailsPage: detailsPage }) => {
    await openEventFromHome(page, { minSeats: 1 });
    await detailsPage.waitForLoaded();
  });

  // Empty the form between tests (no navigation, no reload) so each test fills only its own field.
  // test.beforeEach(async ({ eventDetailsPage: detailsPage }) => {
  //   await detailsPage.clearFieldValue('name');
  //   await detailsPage.clearFieldValue('email');
  //   await detailsPage.clearFieldValue('phone');
  // });

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

  test('Verify the form submits and the booking is confirmed once name, email and phone are all valid', async ({ page, eventDetailsPage: detailsPage, bookings }) => {
    // The phone placeholder is the field's own example; with the name and email already valid from
    // the earlier tests, the whole form is now valid and Confirm Booking should create a booking.
    await detailsPage.setFieldValue('phone', '+91 98765 43210');
    // Track the booking from the API response, so it is deleted even if the confirmation check below fails.
    const created = page.waitForResponse(
      (response) => response.request().method() === 'POST' && /\/bookings\/?$/.test(new URL(response.url()).pathname),
    );
    await detailsPage.confirmBooking();
    const body = await (await created).json().catch(() => undefined);
    if (body?.data?.bookingRef) bookings.track(body.data.bookingRef);
    await expect(detailsPage.confirmationHeading).toBeVisible();
    bookings.track(await detailsPage.confirmationBookingRefText());
  });
});
