# Avtoikonom — Partners E2E Automation

End-to-end automated testing solution for the **Avtoikonom** admin platform,
covering the **Partner lifecycle** (create + update) against
[`https://dev.admin.avtoikonom.com`](https://dev.admin.avtoikonom.com).

Built with **Cypress + TypeScript**, organized as a small but production-shaped
automation project (Page Objects, central selectors, test-data builders,
environment-driven configuration, reporting and CI).

---

## What is covered

The suite automates the required business workflow:

1. Log in to the platform
2. Navigate to the **Partners** section
3. Create a new Partner
4. Populate all required information (Address: `Sofia, Bulgaria`, Type: `Service / Сервиз`)
5. Save the Partner
6. Validate the Partner was created successfully

…and the **entity lifecycle**:

7. Update an existing Partner and validate the changes were persisted

| Spec | Flow |
| --- | --- |
| `cypress/e2e/partners/create-partner.cy.ts` | Login → Partners → Create → Save → Validate |
| `cypress/e2e/partners/update-partner.cy.ts` | Create → Edit → Save → Validate persistence |

---

## Prerequisites

- **Node.js 18+** (CI uses Node 20)
- A modern browser (Chrome recommended; bundled Electron also works)

## Install

```bash
npm install
```

## Configure credentials

Secrets are **never** committed. Provide them in one of two ways:

**Local (recommended):** copy the example env file and keep it git-ignored.

```bash
cp cypress.env.example.json cypress.env.json
```

`cypress.env.json` already contains the provided dev test account:

```json
{
  "userEmail": "test_qa_ex@example.com",
  "userPassword": "test_qa_ex@example.com"
}
```

**CI / environment variables:** set `CYPRESS_userEmail`, `CYPRESS_userPassword`
and optionally `CYPRESS_BASE_URL`. These override the JSON file.

## Run

```bash
# Interactive runner (great for debugging / development)
npm run cy:open

# Headless, full suite (CI mode)
npm test

# Only the Partners specs
npm run test:partners

# Generate a combined HTML report after a headless run
npm run report
```

Quality gates:

```bash
npm run typecheck   # TypeScript, no emit
npm run lint        # ESLint
npm run format      # Prettier
```

---

## Project structure

```
.
├─ cypress/
│  ├─ e2e/partners/                 # Business-readable specs
│  │  ├─ create-partner.cy.ts
│  │  └─ update-partner.cy.ts
│  ├─ fixtures/                     # Static test data
│  │  └─ partner.defaults.json
│  └─ support/
│     ├─ commands.ts                # cy.loginBySession (cached auth)
│     ├─ e2e.ts                     # global hooks / noise filtering
│     ├─ index.d.ts                 # custom command typings
│     ├─ selectors.ts               # single source of truth for selectors
│     ├─ config/env.ts              # typed, fail-fast config access
│     ├─ data/partnerBuilder.ts     # unique, overridable test data
│     └─ pages/                     # Page / Component Objects
│        ├─ BasePage.ts
│        ├─ LoginPage.ts
│        ├─ PartnersPage.ts
│        └─ PartnerFormModal.ts
├─ .github/workflows/e2e.yml        # CI pipeline + artifacts
├─ cypress.config.ts
├─ cypress.env.example.json
├─ tsconfig.json
├─ .eslintrc.cjs / .prettierrc.json
└─ package.json
```

---

## Architecture & key decisions

**Page Object / Component Object Model.** Each screen (`LoginPage`,
`PartnersPage`) and the reusable create/edit dialog (`PartnerFormModal`) is a
class exposing business actions. Specs read as plain language; UI changes are
absorbed in one place. The create/edit modal is a single component object reused
by both lifecycle operations (reusability + abstraction).

**Central selector registry (`selectors.ts`).** All selectors live in one typed
object with a documented strategy: prefer the app's stable element `id`s
(`#name-field`, `#partner-type-field`, …), fall back to Ant Design structural
classes, then accessible text. The app currently exposes no `data-test`
attributes — when the team adds them, only this file changes.

**Session-cached authentication.** `cy.loginBySession()` wraps the real UI login
in `cy.session()`, so the login flow is exercised but executed once and restored
from cache for every subsequent test — faster and far more stable than logging
in through the UI on every test.

**Test-data management.** `buildPartner()` generates **unique, self-describing**
data (timestamp + random suffix) on every run, so tests are independent and
safely re-runnable on a shared dev environment with no collisions. Overrides let
each spec declare only the data it asserts on. Fixed values required by the
assignment (Address, Type) are passed explicitly.

**Reliability & stability.** No fixed `cy.wait(ms)`; the suite leans on
Cypress's built-in retry-ability and asserts on application state (modal closed,
row visible, value persisted). Third-party widgets are handled deliberately —
Ant Design selects via their portal dropdown, Google Places autocomplete by
picking the first real suggestion. CI uses test retries.

**Configuration & environment management.** `baseUrl` and credentials are
environment-driven (`cypress.config.ts` + `config/env.ts`). Config access is
centralized and **fails fast** with an actionable message if something is
missing. Secrets stay out of the repo.

**Observability & debuggability.** Video + screenshots-on-failure, Mochawesome
JSON/HTML reporting, and a `log` task to surface messages in the CI terminal.

**CI/CD readiness.** `.github/workflows/e2e.yml` runs the suite headless on
push/PR, injects credentials from GitHub Secrets, uploads videos/screenshots/the
HTML report as artifacts, and is structured to parallelize via a browser matrix.

---

## Assumptions

- The provided dev credentials and the `Sofia, Bulgaria` Google Places
  suggestion remain available; the address value itself is not validated (per
  the assignment).
- Reference data (service types, subscription tiers) exists; where the
  assignment does not constrain a required field, the suite selects the first
  available option to stay resilient to changing dev data.
- Required fields observed on the form (Name, Type, Services, Subscription plan,
  Address, Telephone, Contact person, Description, Logo) are all populated. The
  Logo upload uses a tiny in-memory PNG so the repo carries no binary fixtures.
- Tests own the entities they create; no cleanup is performed (the dev
  environment already accumulates automation data and unique names avoid
  collisions).

## What I'd improve or extend with more time

- **API-assisted setup/teardown.** Seed and delete Partners via the backend API
  (`cy.request`) to make the update spec faster and to clean up created data.
- **Stronger save validation.** Assert on the create/update network response
  (status + payload) via `cy.intercept`, in addition to the UI list check.
- **`data-test` attributes.** Collaborate with the dev team to add stable test
  hooks, removing reliance on framework classes and localized text.
- **Negative & validation coverage.** Required-field validation, duplicate
  names, server errors.
- **Cross-browser / parallelization.** Expand the CI matrix and shard specs;
  optionally integrate Cypress Cloud for flake detection and analytics.
- **Accessibility checks.** Layer in `cypress-axe` on key screens.
