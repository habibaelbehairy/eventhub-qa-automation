import { faker } from '@faker-js/faker';
import { CustomerDetails } from '../page_objects/EventDetailsPage';
import { EventFormData } from '../page_objects/admin/AdminEventsPage';
import { futureDateTime } from './dates';

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
