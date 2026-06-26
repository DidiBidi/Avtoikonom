import { defineConfig } from 'cypress';

/**
 * Cypress configuration.
 *
 * Environment / configuration management:
 * - `baseUrl` and credentials are environment-driven so the same suite can run
 *   against dev/staging/prod without code changes.
 * - Secrets are NEVER hard-coded. They are provided via (in order of precedence):
 *     1. `CYPRESS_*` OS environment variables (used in CI), e.g. CYPRESS_userEmail
 *     2. a git-ignored `cypress.env.json` (used locally)
 *   See `cypress.env.example.json` and the README for details.
 */
export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'https://dev.admin.avtoikonom.com',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    viewportWidth: 1440,
    viewportHeight: 900,

    // Reliability: retry flaky-prone runs in CI, but never mask failures locally.
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Stability: generous but bounded timeouts for a SPA with async data + maps.
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,

    // Observability: capture artifacts on failure for debuggability in CI.
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,

    // Reporting: machine-readable + human-readable reports for CI/CD.
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports/mochawesome',
      overwrite: false,
      html: false,
      json: true,
      charts: true,
    },

    setupNodeEvents(on, config) {
      // Surface useful logs from the browser into the Node terminal (CI debuggability).
      on('task', {
        log(message: string) {
          // eslint-disable-next-line no-console
          console.log(message);
          return null;
        },
      });

      return config;
    },
  },
});
