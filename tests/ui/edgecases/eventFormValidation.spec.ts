import { test, expect, cleanUpTestData } from '../../../fixtures';
import type { EventFormField } from '../../../page_objects/admin/AdminEventsPage';
import { pastDateTime } from '../../../utils/dates';

/**
 * Admin > Manage Events — "+ New Event" form content and field validation (UI only).
 * The form is filled progressively, each test adding a valid value or checking one invalid value,
 * without navigating away or reloading the page.
 * The invalid-input tests are blocked by validation and create no event; the final test submits
 * the now-complete, valid form and checks the event is created (cleaned up by the admin afterAll).
 */
test.describe('Event form content and validation', { tag: ['@ui', '@admin', '@edge'] }, () => {
  test.afterAll(({ fileSession }) => cleanUpTestData(fileSession));

  test.beforeAll(async ({ adminEventsPage }) => {
    await adminEventsPage.nav.goToManageEvents();
    await adminEventsPage.waitForLoaded();
  });

  // ------------------------------------------------------------------ Form content
  test('Verify form shows labels and the Add Event button', async ({ adminEventsPage }) => {
    const content = adminEventsPage.props.formContent;

    for (const field of Object.keys(content.labels) as EventFormField[]) {
      await expect(adminEventsPage.fieldInput(field)).toHaveAccessibleName(content.labels[field]);
      await expect(adminEventsPage.fieldInput(field)).toBeEmpty();
    }
    await expect(adminEventsPage.addEventButton).toHaveText(content.addButton);
    await expect(adminEventsPage.addEventButton).toBeEnabled();
  });

  // ------------------------------------------------------------------ Empty form
  test('Verify all six errors are shown and no event is made when the form is empty', async ({ adminEventsPage }) => {
    await adminEventsPage.submitForm();
    for (const field of Object.keys(adminEventsPage.props.messages) as EventFormField[]) {
      await adminEventsPage.assertInlineError(field);
    }
    await adminEventsPage.assertNoEventCreated();
  });

  // ------------------------------------------------------------------ Title
  test('Verify title error is shown when the title is only spaces', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('title', '   ');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertInlineError('title');
    await adminEventsPage.assertNoEventCreated();
  });

  test('Verify a valid title is accepted', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('title', 'QA Validation Event');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertNoInlineError('title');
    await adminEventsPage.assertNoEventCreated();
  });


  // ------------------------------------------------------------------ Description (optional field)
  test('Verify description is optional: no error is shown when it is empty', async ({ adminEventsPage }) => {
    await adminEventsPage.descriptionInput.fill('');
    await adminEventsPage.submitForm();
    await expect(adminEventsPage.formErrors.filter({ hasText: /description/i })).toHaveCount(0);
    await adminEventsPage.assertNoEventCreated();
  });

  test('Verify a valid description is accepted', async ({ adminEventsPage }) => {
    await adminEventsPage.descriptionInput.fill('This is a test event for QA validation.');
    await adminEventsPage.submitForm();
    await expect(adminEventsPage.formErrors.filter({ hasText: /description/i })).toHaveCount(0);
    await adminEventsPage.assertNoEventCreated();
  });


  // ------------------------------------------------------------------ City and venue
  test('Verify city error is shown when the city is only spaces', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('city', '   ');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertInlineError('city');
    await adminEventsPage.assertNoEventCreated();
  });

  test('Verify a valid city is accepted', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('city', 'New York');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertNoInlineError('city');
    await adminEventsPage.assertNoEventCreated();
  });

  test('Verify venue error is shown when the venue is only spaces', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('venue', '   ');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertInlineError('venue');
    await adminEventsPage.assertNoEventCreated();
  });

    test('Verify a valid venue is accepted', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('venue', 'Madison Square Garden');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertNoInlineError('venue');
    await adminEventsPage.assertNoEventCreated();
  });

  // ------------------------------------------------------------------ Date
  test('Verify date error is shown when the date is in the past', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('dateTime', pastDateTime());
    await adminEventsPage.submitForm();
    await expect(adminEventsPage.validationError('Must be a future date')).toBeVisible();
    await adminEventsPage.assertNoEventCreated();
  });

  test('Verify a valid date is accepted', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('dateTime', '2030-01-15T10:00');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertNoInlineError('dateTime');
    await adminEventsPage.assertNoEventCreated();
  });

  // ------------------------------------------------------------------ Price
  test('Verify price error is shown when the price is negative', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('price', '-1');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertInlineError('price');
    await adminEventsPage.assertNoEventCreated();
  });

  test('Verify price 0 (a free event) is accepted', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('price', '0');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertNoInlineError('price');
    await adminEventsPage.assertNoEventCreated();
  });

  test('Verify a decimal price is accepted', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('price', '49.99');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertNoInlineError('price');
    await adminEventsPage.assertNoEventCreated();
  });

  // ------------------------------------------------------------------ Seats
  test('Verify seats error is shown when the number of seats is 0', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('totalSeats', '0');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertInlineError('totalSeats');
    await adminEventsPage.assertNoEventCreated();
  });

  test('Verify seats error is shown when the number of seats is negative', async ({ adminEventsPage }) => {
    await adminEventsPage.setFieldValue('totalSeats', '-5');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertInlineError('totalSeats');
    await adminEventsPage.assertNoEventCreated();
  });

  // Expected failure (defect 3): the form shows no inline error for a fractional seat count.
  test('Verify seats error is shown when the number of seats is a decimal', { tag: '@xfail' }, async ({ adminEventsPage }) => {
    test.fail(true, 'Defect 3: a fractional seat count (1.5) is not rejected by the form');
    await adminEventsPage.setFieldValue('totalSeats', '1.5');
    await adminEventsPage.submitForm();
    await adminEventsPage.assertInlineError('totalSeats');
    await adminEventsPage.assertNoEventCreated();
  });

  test('Verify the form submits and the event is created once every required field is valid', async ({ adminEventsPage, events }) => {
    // With title, city, venue, date and price already valid from the earlier tests, setting a
    // valid seat count completes the form, so Add Event should create the event.
    events.track('QA Validation Event'); // deleted through the API after the test, even if it fails
    await adminEventsPage.setFieldValue('totalSeats', '1');
    await adminEventsPage.addEventButton.click();
    await expect(adminEventsPage.eventRow('QA Validation Event')).toBeVisible();
  });


});