import { loginPage } from './pages/LoginPage';
import { env } from './config/env';

/**
 * Custom commands.
 *
 * `loginBySession` wraps the UI login in `cy.session()`, so authentication is
 * performed once and the resulting browser state is cached and restored for
 * every subsequent test. This makes the suite fast (no repeated UI logins) and
 * stable, while still exercising the real login flow at least once.
 */
Cypress.Commands.add('loginBySession', (email?: string, password?: string) => {
  const user = email ?? env.userEmail;
  const pass = password ?? env.userPassword;

  cy.session(
    ['avtoikonom-user', user],
    () => {
      loginPage.login(user, pass);
    },
    {
      validate() {
        // A valid session has an `auth` entry in localStorage.
        cy.window().its('localStorage').invoke('getItem', 'auth').should('exist');
      },
      cacheAcrossSpecs: true,
    },
  );
});

export {};
