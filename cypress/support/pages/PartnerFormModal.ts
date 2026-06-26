import { selectors } from '../selectors';
import type { PartnerData } from '../data/partnerBuilder';

/**
 * Component Object for the Partner create/edit modal.
 *
 * The same modal is reused for both "New partner" and "Edit partner", so a
 * single reusable abstraction covers both lifecycle operations (reusability).
 * Each method encapsulates one tricky third-party widget (Ant Design selects,
 * Google Places autocomplete, hidden file input) so specs never deal with them.
 */
export class PartnerFormModal {
  private get root() {
    return cy.get(selectors.partners.form.modal, { timeout: 15000 }).should('be.visible');
  }

  /** Open an Ant Design select and choose an option by its visible label. */
  private selectAntOption(fieldSelector: string, optionLabel: string): void {
    cy.get(fieldSelector).click({ force: true });
    this.openDropdown().contains(selectors.antd.option, optionLabel).click({ force: true });
  }

  /** Open an Ant Design select and choose the first available option. */
  private selectFirstAntOption(fieldSelector: string): void {
    cy.get(fieldSelector).click({ force: true });
    // Force-click the first option: the dropdown slides in with an animation,
    // and clicking mid-animation can otherwise miss. Re-querying (no element
    // capture) lets Cypress retry if Ant Design re-renders the virtual list.
    this.openDropdown().find(selectors.antd.option).first().click({ force: true });
  }

  /** Return the visible Ant dropdown panel once it has finished animating in. */
  private openDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .get(selectors.antd.openDropdown)
      .should('be.visible')
      .and('not.have.class', 'ant-slide-up-appear-active')
      .and('not.have.class', 'ant-slide-up-leave-active');
  }

  fillName(name: string): this {
    this.root.find(selectors.partners.form.nameInput).clear().type(name);
    return this;
  }

  selectType(typeLabel: string): this {
    this.selectAntOption(selectors.partners.form.typeSelect, typeLabel);
    return this;
  }

  /** Select a service by label, or the first available if none provided. */
  selectService(serviceLabel?: string): this {
    if (serviceLabel) {
      this.selectAntOption(selectors.partners.form.servicesSelect, serviceLabel);
    } else {
      this.selectFirstAntOption(selectors.partners.form.servicesSelect);
    }
    // Close the multi-select dropdown so it doesn't overlay the next field.
    this.root.find(selectors.partners.form.nameInput).click();
    return this;
  }

  selectSubscriptionPlan(planLabel?: string): this {
    if (planLabel) {
      this.selectAntOption(selectors.partners.form.subscriptionSelect, planLabel);
    } else {
      this.selectFirstAntOption(selectors.partners.form.subscriptionSelect);
    }
    return this;
  }

  /**
   * Address is powered by Google Places Autocomplete. We type the query and
   * pick the first real suggestion. Per the assignment, the address value
   * itself is not validated.
   */
  fillAddress(address: string): this {
    this.root.find(selectors.partners.form.addressInput).clear().type(address, { delay: 80 });
    // The suggestion list is appended to <body>, outside the modal.
    cy.get(selectors.googlePlaces.container, { timeout: 15000 })
      .should('be.visible')
      .find(selectors.googlePlaces.item)
      .first()
      .click();
    return this;
  }

  fillPhone(phone: string): this {
    // Country defaults to Bulgaria (+359); we only set the subscriber number.
    this.root.find(selectors.partners.form.phoneInput).clear().type(phone);
    return this;
  }

  fillContactPerson(name: string): this {
    this.root.find(selectors.partners.form.contactPersonInput).clear().type(name);
    return this;
  }

  fillDescription(description: string): this {
    this.root.find(selectors.partners.form.descriptionInput).clear().type(description);
    return this;
  }

  /**
   * Logo is a required image upload behind a hidden <input type="file">.
   * We use a small real PNG fixture (large enough for the in-app cropper to
   * produce a valid data URL; a 1px image yields an empty "data:," and the API
   * rejects it). Selecting a file opens an "Edit photo" cropper modal that must
   * be confirmed before the image is applied to the partner form.
   */
  uploadLogo(): this {
    this.root
      .find(selectors.partners.form.logoInput)
      .selectFile('cypress/fixtures/logo.png', { force: true });
    // Confirm the photo cropper to apply the logo.
    cy.get(selectors.partners.photoCropper.modal).should('be.visible');
    cy.get(selectors.partners.photoCropper.saveButton).click();
    cy.get(selectors.partners.photoCropper.modal).should('not.exist');
    return this;
  }

  /** Fill every required field from a data object. */
  fill(data: PartnerData): this {
    this.fillName(data.name);
    this.selectType(data.type);
    this.selectService(data.serviceType);
    this.selectSubscriptionPlan(data.subscriptionPlan);
    this.fillAddress(data.address);
    this.fillPhone(data.phone);
    this.fillContactPerson(data.contactPerson);
    this.fillDescription(data.description);
    this.uploadLogo();
    return this;
  }

  /**
   * Submit the form and assert the save actually succeeded.
   *
   * The modal closes even when the API rejects the payload (an error toast is
   * shown), so closing alone is NOT a reliable success signal. We therefore
   * intercept the write request (create = POST `/admin/partner`, update =
   * PUT `/admin/partner/:id`) and assert a 2xx status. This makes failures
   * observable and unambiguous instead of surfacing later as "row not found".
   */
  save(method: 'POST' | 'PUT' = 'POST'): void {
    const alias = 'savePartner';
    const url = method === 'POST' ? '**/admin/partner' : '**/admin/partner/*';
    cy.intercept({ method, url }).as(alias);

    cy.get(selectors.partners.form.saveButton).click();

    cy.wait(`@${alias}`).its('response.statusCode').should('be.within', 200, 299);
    // And the modal must close once the save is accepted.
    cy.get(selectors.partners.form.modal, { timeout: 15000 }).should('not.exist');
  }

  cancel(): void {
    cy.get(selectors.partners.form.cancelButton).click();
  }
}
