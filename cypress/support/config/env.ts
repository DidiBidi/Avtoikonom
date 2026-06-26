/**
 * Centralized environment & configuration access.
 *
 * Keeping all environment reads behind a single typed module means:
 * - tests never touch `Cypress.env(...)` directly (single source of truth),
 * - missing configuration fails fast with a clear message,
 * - swapping environments is a pure configuration concern.
 */

function required(key: string): string {
  const value = Cypress.env(key) as string | undefined;
  if (!value) {
    throw new Error(
      `Missing required configuration "${key}". ` +
        `Provide it via cypress.env.json or a CYPRESS_${key} environment variable. ` +
        `See cypress.env.example.json.`,
    );
  }
  return value;
}

export const env = {
  baseUrl: Cypress.config('baseUrl') as string,
  get userEmail(): string {
    return required('userEmail');
  },
  get userPassword(): string {
    return required('userPassword');
  },
};
