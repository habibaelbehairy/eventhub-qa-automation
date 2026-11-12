import { faker } from '@faker-js/faker';
import { CustomerDetails } from '../page_objects/EventDetailsPage';

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
