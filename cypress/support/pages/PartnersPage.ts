import { BasePage } from './BasePage';
import { selectors } from '../selectors';
import { PartnerFormModal } from './PartnerFormModal';

/**
 * Partners list screen (`/partners`).
 *
 * Responsible for navigation and list-level interactions (search, open create
 * modal, open a row's actions). Form interactions are delegated to
 * {@link PartnerFormModal}.
 */
export class PartnersPage extends BasePage {
  protected readonly path = '/partners';

  readonly form = new PartnerFormModal();

  /** Confirm we are on the Partners screen and the list has rendered. */
  assertLoaded(): this {
    cy.location('pathname').should('include', '/partners');
    cy.get(selectors.partners.list.newPartnerButton).should('be.visible');
    return this;
  }

  openCreateForm(): PartnerFormModal {
    cy.get(selectors.partners.list.newPartnerButton).click();
    cy.get(selectors.partners.form.modal).should('be.visible');
    return this.form;
  }

  /** Type into the search box to filter the (large, paginated) list. */
  search(term: string): this {
    cy.get(selectors.partners.list.searchInput).clear();
    cy.get(selectors.partners.list.searchInput).type(term);
    // Allow the debounced, server-side search to settle.
    cy.get(selectors.partners.list.table).should('exist');
    return this;
  }

  /** Get the table row that contains the given partner name. */
  rowByName(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(selectors.partners.list.row, name, { timeout: 15000 });
  }

  assertPartnerExists(name: string): this {
    this.search(name);
    this.rowByName(name).should('be.visible');
    return this;
  }

  /** Open the row actions menu for a partner and click "Edit". */
  openEditForm(name: string): PartnerFormModal {
    this.search(name);
    this.rowByName(name)
      .find(selectors.partners.list.rowActionsTrigger)
      .first()
      .click({ force: true });
    cy.get('body').contains('li', 'Edit').click();
    cy.get(selectors.partners.form.modal).should('be.visible');
    return this.form;
  }
}

export const partnersPage = new PartnersPage();
