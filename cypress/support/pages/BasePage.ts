/**
 * Base class for Page Objects.
 *
 * Page Objects encapsulate *where* things are and *how* to interact with a
 * screen, so specs can read as plain business language. This keeps tests
 * readable and means UI changes are absorbed in one place (maintainability).
 */
export abstract class BasePage {
  /** Path this page lives at, relative to baseUrl. */
  protected abstract readonly path: string;

  visit(): this {
    cy.visit(this.path);
    return this;
  }

  protected get<E extends Node = HTMLElement>(selector: string): Cypress.Chainable<JQuery<E>> {
    return cy.get<E>(selector);
  }
}
