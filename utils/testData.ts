import { faker } from '@faker-js/faker';
import type { CustomerDetails } from '../page_objects/EventDetailsPage';
import type { EventFormData } from '../page_objects/admin/AdminEventsPage';
import type { CreateBookingInput, CreateEventInput } from '../api/EventHubApi';
import { futureDateTime, futureIsoDateTime } from './dates';

/** Random, valid customer details for the booking form. */
export function buildCustomer(overrides: Partial<CustomerDetails> = {}): CustomerDetails {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName, provider: 'example.com' }).toLowerCase(),
    // UI requires exactly 10 digits; start with 9 so it looks like a real mobile number.
    phone: `9${faker.string.numeric(9)}`,
    ...overrides,
  };
}

/** Valid event for the admin form. The title is unique, so a test finds its own event on the shared site. */
export function buildEvent(overrides: Partial<EventFormData> = {}): EventFormData {
  return {
    title: `QA Event ${faker.string.alphanumeric(8)}`,
    description: faker.lorem.sentence(),
    category: 'Workshop',
    city: 'Pune',
    venue: `${faker.location.street()}, Pune`,
    dateTime: futureDateTime(),
    price: 50,
    totalSeats: 20,
    ...overrides,
  };
}

/** Valid body for POST /events. The unique title lets a test find its own event among the shared data. */
export function buildApiEvent(overrides: Partial<CreateEventInput> = {}): CreateEventInput {
  return {
    title: `QA Event ${faker.string.alphanumeric(8)}`,
    description: faker.lorem.sentence(),
    category: 'Workshop',
    venue: `${faker.location.street()}, Pune`,
    city: 'Pune',
    eventDate: futureIsoDateTime(),
    price: 50,
    totalSeats: 20,
    ...overrides,
  };
}

/** Valid body for POST /bookings on the given event. */
export function buildApiBooking(eventId: number, overrides: Partial<CreateBookingInput> = {}): CreateBookingInput {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    eventId,
    customerName: `${firstName} ${lastName}`,
    customerEmail: faker.internet.email({ firstName, lastName, provider: 'example.com' }).toLowerCase(),
    // API requires at least 10 characters; keep it looking like a real mobile number.
    customerPhone: `+91 9${faker.string.numeric(9)}`,
    quantity: 2,
    ...overrides,
  };
}
