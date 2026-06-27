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

| Spec                       | Test                      | Flow                                                                               |
| -------------------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| `partners-lifecycle.cy.ts` | Required-field validation | Save empty form → every field shows its inline error, **no API call is made**      |
| `partners-lifecycle.cy.ts` | Create & persist          | Create with 2 services → Save → found in list, both services persist on re-open    |
| `partners-lifecycle.cy.ts` | Update & persist          | Edit name/contact → Save → validate new values, old name gone                      |
| `partners-lifecycle.cy.ts` | Change subscription plan  | Edit → pick a different plan → Save (PUT 2xx) → list shows new plan                |
| `partners-lifecycle.cy.ts` | Update logo image         | Edit → re-upload via cropper → Save → re-open: preview src points at a NEW S3 file |

Both a **positive** path (happy-path create/update, multi-select, image upload,
subscription change) and a **negative** path (client-side validation blocks an
invalid submission before it reaches the API) are covered.

---

## Prerequisites

- **Node.js 18+** (CI uses Node 20)
- **No browser install required.** Cypress ships a bundled Electron that runs
  the whole suite out of the box. Chrome/Firefox are optional and only needed
  for the explicit `test:chrome` / `test:firefox` runs.

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

Fill `cypress.env.json` with the dev test account credentials (provided
separately, never committed):

```json
{
  "userEmail": "<your-dev-test-email>",
  "userPassword": "<your-dev-test-password>"
}
```

**CI / environment variables:** set `CYPRESS_userEmail`, `CYPRESS_userPassword`
and optionally `CYPRESS_BASE_URL`. These override the JSON file.

## Run

```bash
# Interactive runner (great for debugging / development)
npm run cy:open

# Headless, full suite (CI mode — bundled Electron, no browser install needed)
npm test

# Pick a specific browser (cross-browser; requires that browser installed)
npm run test:chrome
npm run test:firefox

# Only the Partners specs (bundled Electron)
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
│  │  └─ partners-lifecycle.cy.ts
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

**End-to-end means the full UI lifecycle — both operations.** The assignment
defines two equally weighted workflows (create and update), so both are driven
entirely through the real UI, API and database — exactly as a user would. The
suite deliberately **creates its Partner through the UI** rather than seeding it
via a direct API call. Seeding through the API would be faster, but it would
exercise the create path in only one test and weaken the coverage the task
explicitly asks for. Create and update share a single `PartnerFormModal`
component object, so the create step is an honest, reused precondition — not
duplicated logic.

**Scalability: create one Partner for the whole lifecycle.** Both operations
live in a single ordered spec (`partners-lifecycle.cy.ts`): the negative
validation test (which creates nothing), then one positive create, then the
edit tests that all mutate that same Partner — tracking its live name across the
rename. Creating a fresh Partner per test does not scale: at hundreds of tests
the repeated UI create would dominate runtime _and_ leave behind one new account
per test. Here the entire file creates **exactly one** Partner. Cypress isolates
tests by resetting page state, so a cheap `beforeEach` only re-loads a fresh
list (navigation, not a re-create), keeping the footprint on the shared
environment minimal.

**Why not seed test data through the API?** A common shortcut is to create
prerequisite entities via `cy.request` against the backend. It was considered
and deliberately **rejected** for this project, because here the trade-off
favours the UI approach:

- **Coverage, not just speed.** The only place a Partner is needed as a
  precondition is the edit tests. Creating it through the UI exercises the
  create flow in _every_ run; an API seed would shrink real create coverage to a
  single test while saving only a few seconds.
- **Fidelity.** The create flow has genuinely tricky UI: Ant Design portal
  dropdowns, a multi-select, Google Places autocomplete, and a two-step image
  cropper that produces the logo as a `data:` URL. An API seed would have to
  reconstruct that payload by hand — bypassing exactly the behaviour most likely
  to break, and which an E2E suite exists to protect.
- **Resilience & low coupling.** Driving the public UI keeps the suite decoupled
  from internal API contracts (auth-token shape, region headers, request body).
  Those can change without breaking the tests, so there is less to maintain.
- **One obvious source of truth.** Both the precondition and the assertion go
  through the same screens a user sees, so a failure points directly at the user
  experience rather than at a test-only backdoor that may drift from production
  behaviour.

The cost we accept is a slightly slower setup — a deliberate, well-understood
trade in favour of higher confidence. API seeding would become worthwhile if
many specs needed a pre-existing Partner and the create flow were covered
elsewhere; at that point the UI setup would be pure overhead.

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
HTML report as artifacts, and runs a **cross-browser matrix (Chrome + Firefox)**
in parallel — Chrome is the primary target and Firefox proves the suite is not
coupled to a single engine. The matrix is the natural place to add more browsers
or shard specs as the suite grows.

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
  Logo upload uses a small committed PNG fixture (`cypress/fixtures/logo.png`)
  so the asset is reproduced exactly on any machine after clone; the backend
  validates the uploaded image data, so a real PNG is required.
- Tests own the entities they create. No teardown is performed: the test user
  has no permission to delete Partners (the backend returns 403, and the UI
  exposes no working delete for this role). Creating a single Partner per spec
  keeps the footprint minimal, and unique timestamped names keep runs
  collision-free.
- The form enforces **required-field** validation only; it exposes no
  client-side **length** constraints (verified live — `Name` accepts a single
  character and 600+ characters without error). A length test was therefore
  intentionally omitted, as it would assert against a rule the application does
  not implement; any limit is enforced server-side and is out of scope here.

## What I'd improve or extend with more time

- **`data-test` attributes.** Collaborate with the dev team to add stable test
  hooks, removing reliance on framework classes and localized text.
- **Wider negative coverage.** Duplicate names, server-error handling, and
  per-field validation messages on edit (required-field validation on create is
  already covered).
- **Sharding & Cypress Cloud.** Shard specs across containers for speed and
  optionally integrate Cypress Cloud for flake detection and analytics
  (cross-browser on Chrome + Firefox is already wired into CI).
- **Accessibility checks.** Layer in `cypress-axe` on key screens.
