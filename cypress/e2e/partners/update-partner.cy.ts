import { partnersPage } from '../../support/pages/PartnersPage';
import { buildPartner, type PartnerData } from '../../support/data/partnerBuilder';
import { selectors } from '../../support/selectors';

/**
 * Entity lifecycle: create a Partner, then UPDATE it and validate that the
 * changes were persisted correctly.
 *
 * The test owns the entity it edits: a fresh Partner is created in `beforeEach`
 * so the test is fully independent, re-runnable, and safe to retry on the
 * shared environment — each attempt edits its own entity and never depends on
 * pre-existing data it does not control.
 */
describe('Partners - update', () => {
  let original: PartnerData;
  let updatedName: string;
  let updatedContact: string;

  beforeEach(() => {
    cy.loginBySession();
    partnersPage.visit().assertLoaded();

    original = buildPartner({ type: 'Service', address: 'Sofia, Bulgaria' });
    // A distinct unique name (not a superset of the original) so a search for
    // the original name returns no rows once the Partner has been renamed.
    updatedName = buildPartner().name;
    updatedContact = `Updated Contact ${Date.now()}`;

    partnersPage.openCreateForm().fill(original).save();
    partnersPage.assertPartnerExists(original.name);
  });

  it('updates an existing Partner and persists the changes', () => {
    partnersPage
      .openEditForm(original.name)
      .fillName(updatedName)
      .fillContactPerson(updatedContact)
      .save('PUT');

    // Validate persistence: re-query the list for the new values.
    partnersPage.assertPartnerExists(updatedName);
    partnersPage.rowByName(updatedName).should('contain.text', updatedContact);

    // And confirm the old name no longer matches any row (it was renamed).
    partnersPage.search(original.name);
    cy.contains(selectors.partners.list.row, original.name).should('not.exist');
  });
});
