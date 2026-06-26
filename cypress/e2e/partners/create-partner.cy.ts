import { partnersPage } from '../../support/pages/PartnersPage';
import { buildPartner } from '../../support/data/partnerBuilder';

/**
 * Business workflow:
 *   Log in -> Partners -> Create -> populate required fields -> Save -> validate.
 *
 * Authentication is handled once via a cached session; each test starts from a
 * clean, authenticated visit to the Partners screen.
 */
describe('Partners - create', () => {
  beforeEach(() => {
    cy.loginBySession();
    partnersPage.visit().assertLoaded();
  });

  it('creates a new Partner and persists it in the list', () => {
    const partner = buildPartner({
      // Per assignment: Type "Service / Сервиз" and Address "Sofia, Bulgaria".
      type: 'Service',
      address: 'Sofia, Bulgaria',
    });

    partnersPage.openCreateForm().fill(partner).save();

    // Validate the Partner was created and is discoverable in the list.
    partnersPage.assertPartnerExists(partner.name);
  });
});
