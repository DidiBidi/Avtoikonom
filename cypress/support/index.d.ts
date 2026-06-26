export {};

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Log in once and cache the authenticated session across tests/specs.
       * Falls back to credentials from configuration when none are provided.
       */
      loginBySession(email?: string, password?: string): Chainable<void>;
    }
  }
}
