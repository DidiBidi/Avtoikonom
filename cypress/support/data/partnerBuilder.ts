import { faker } from '@faker-js/faker';

/**
 * Domain model for a Partner as the tests care about it.
 * `serviceType` and `subscriptionPlan` use a `match` strategy ("exact" vs
 * "first available") so specs stay resilient to changing reference data on the
 * shared dev environment.
 */
export interface PartnerData {
  name: string;
  /** Visible label of the partner type, e.g. "Service" / "Сервиз". */
  type: string;
  /** Visible label of a service; if omitted, the first available is picked. */
  serviceType?: string;
  /** Visible label of a subscription tier; if omitted, the first available is picked. */
  subscriptionPlan?: string;
  address: string;
  phone: string;
  contactPerson: string;
  description: string;
}

/**
 * Test-data builder.
 *
 * - Generates UNIQUE, self-describing data on every run so tests are independent
 *   and safely re-runnable on a shared environment (no collisions, easy cleanup,
 *   easy to spot in the UI).
 * - Accepts overrides so each spec declares only what it actually asserts on.
 */
export function buildPartner(overrides: Partial<PartnerData> = {}): PartnerData {
  const uniqueSuffix = `${Date.now()}-${faker.string.alphanumeric(4)}`;

  return {
    name: `E2E-Partner-${uniqueSuffix}`,
    type: 'Service',
    // Fixed per assignment; the address itself is not validated.
    address: 'Sofia, Bulgaria',
    phone: '888123456',
    contactPerson: `QA Contact ${faker.person.lastName()}`,
    description: `Created by automated E2E suite at ${new Date().toISOString()}`,
    ...overrides,
  };
}
