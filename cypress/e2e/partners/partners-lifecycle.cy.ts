import { partnersPage } from '../../support/pages/PartnersPage';
import { buildPartner, type PartnerData } from '../../support/data/partnerBuilder';
import { selectors } from '../../support/selectors';

/**
 * Full Partner lifecycle in a single spec, ordered to minimise the number of
 * Partner accounts created against the shared dev environment:
 *   1. Negative create — required-field validation (creates nothing).
 *   2. Positive create — creates ONE Partner (with multiple services) and
 *      validates persistence. This is the single entity reused below.
 *   3. Update flows — rename, subscription plan, logo — all mutate that same
 *      Partner, so the whole file creates exactly one account.
 *
 * Tests run top-to-bottom; the create test is an explicit precondition for the
 * edit tests. The Partner's live name is tracked in `currentName` because the
 * rename test changes it. Cypress resets page state between tests, so a cheap
 * `beforeEach` re-loads a fresh, unfiltered list (navigation only, not a
 * re-create) before each test.
 *
 * Cleanup: the test user cannot delete Partners (the backend returns 403 and
 * the UI exposes no working delete for this role), so no teardown is performed;
 * unique timestamped names keep runs collision-free.
 */
describe('Partners - lifecycle', () => {
  let partner: PartnerData;
  let currentName: string;

  beforeEach(() => {
    cy.loginBySession();
    partnersPage.visit().assertLoaded();
  });

  it('blocks submission and shows validation errors when required fields are empty', () => {
    // Guard: a rejected form must NOT reach the API.
    cy.intercept('POST', '**/admin/partner').as('createPartner');

    const form = partnersPage.openCreateForm();
    form.clickSave();

    // Every required field surfaces its own inline message (client-side).
    form.assertValidationError('Please write a name');
    form.assertValidationError('Please enter a type!');
    form.assertValidationError('Please enter services!');
    form.assertValidationError('Please enter a subscription plan!');
    form.assertValidationError('Please choose an address!');
    form.assertValidationError('Please enter a phone number');
    form.assertValidationError('Please enter a contact person!');
    form.assertValidationError('Please enter a description!');
    form.assertValidationError('Please enter a logo!');

    // No create request should have been sent and the form stays open.
    cy.get('@createPartner.all').should('have.length', 0);
  });

  it('creates a new Partner with multiple services and persists it', () => {
    partner = buildPartner({
      // Per assignment: Type "Service / Сервиз" and Address "Sofia, Bulgaria".
      type: 'Service',
      address: 'Sofia, Bulgaria',
    });
    currentName = partner.name;

    const form = partnersPage.openCreateForm();
    form.fillName(partner.name);
    form.selectType(partner.type);
    form.selectServices(2);
    form.selectSubscriptionPlan();
    form.fillAddress(partner.address);
    form.fillPhone(partner.phone);
    form.fillContactPerson(partner.contactPerson);
    form.fillDescription(partner.description);
    form.uploadLogo();

    // Both services are selected before saving.
    form.assertServiceCount(2);
    form.save();

    // Validate the Partner was created and is discoverable in the list.
    partnersPage.assertPartnerExists(partner.name);
    // And both services persisted (re-open and assert).
    partnersPage.openEditForm(partner.name).assertServiceCount(2);
  });

  it('updates an existing Partner and persists the changes', () => {
    const updatedName = buildPartner().name;
    const updatedContact = `Updated Contact ${Date.now()}`;

    partnersPage
      .openEditForm(currentName)
      .fillName(updatedName)
      .fillContactPerson(updatedContact)
      .save('PUT');

    // The rename has persisted (save asserts 2xx); track the live name so the
    // following tests keep locating the row.
    currentName = updatedName;

    // Validate persistence: re-query the list for the new values.
    partnersPage.assertPartnerExists(updatedName);
    partnersPage.rowByName(updatedName).should('contain.text', updatedContact);

    // And confirm the old name no longer matches any row (it was renamed).
    partnersPage.search(partner.name);
    cy.contains(selectors.partners.list.row, partner.name).should('not.exist');
  });

  it('changes the subscription plan and persists it', () => {
    const form = partnersPage.openEditForm(currentName);

    let newPlan = '';
    form.changeSubscriptionPlan().then((plan) => {
      newPlan = plan;
    });

    cy.then(() => form.save('PUT'));

    // The list reflects the new subscription plan for this Partner. The list
    // renders the plan in upper-case, so compare case-insensitively.
    partnersPage.assertPartnerExists(currentName);
    cy.then(() => {
      partnersPage
        .rowByName(currentName)
        .invoke('text')
        .then((rowText) => {
          expect(rowText.toLowerCase()).to.include(newPlan.toLowerCase());
        });
    });
  });

  it('updates the Partner logo image and persists the new image', () => {
    // Capture the current logo preview src, re-upload a new image, then re-open
    // and assert the preview points at a NEW uploaded file under the partner's
    // S3 media path — proving the image change actually persisted, not merely
    // that the PUT returned 2xx.
    let originalSrc = '';
    partnersPage
      .openEditForm(currentName)
      .getLogoSrc()
      .then((src) => {
        originalSrc = src;
      });

    cy.then(() => partnersPage.form.uploadLogo().save('PUT'));

    partnersPage
      .openEditForm(currentName)
      .getLogoSrc()
      .then((newSrc) => {
        expect(newSrc, 'logo preview src').to.include('/media/partners/');
        expect(newSrc, 'logo changed').to.not.equal(originalSrc);
      });
  });
});
