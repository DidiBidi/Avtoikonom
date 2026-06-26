import { BasePage } from './BasePage';
import { selectors } from '../selectors';

/**
 * Login screen (`/login`).
 *
 * Exposes a single high-level `login()` action. Whenever possible, prefer
 * `cy.loginBySession()` (see custom commands) which caches the authenticated
 * state and only drives this UI once per session — faster and more stable.
 */
export class LoginPage extends BasePage {
  protected readonly path = '/login';

  fillEmail(email: string): this {
    cy.get(selectors.login.emailInput).first().clear();
    cy.get(selectors.login.emailInput).first().type(email);
    return this;
  }

  fillPassword(password: string): this {
    cy.get(selectors.login.passwordInput).clear();
    cy.get(selectors.login.passwordInput).type(password, { log: false });
    return this;
  }

  submit(): this {
    cy.get(selectors.login.submitButton).first().click();
    return this;
  }

  login(email: string, password: string): this {
    this.visit();
    this.fillEmail(email);
    this.fillPassword(password);
    this.submit();
    // Login is confirmed by leaving the /login route.
    cy.location('pathname', { timeout: 20000 }).should('not.include', '/login');
    return this;
  }
}

export const loginPage = new LoginPage();
