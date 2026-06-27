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

  /**
   * Services is a multi-select. Select the first `count` available options.
   * Re-querying before each click (no captured nodes) avoids detached-node
   * flakes when Ant Design re-renders its virtual list.
   */
  selectServices(count: number): this {
    cy.get(selectors.partners.form.servicesSelect).click({ force: true });
    for (let i = 0; i < count; i += 1) {
      this.openDropdown().find(selectors.antd.option).eq(i).click({ force: true });
    }
    // Close the dropdown so it doesn't overlay the next field.
    this.root.find(selectors.partners.form.nameInput).click();
    return this;
  }

  /** Assert exactly `count` services are selected as tags in the form. */
  assertServiceCount(count: number): this {
    // Multi-select tags render as overflow items; the trailing suffix item is
    // the (empty) search input, so it is excluded from the count.
    this.root
      .find(selectors.partners.form.servicesSelect)
      .closest('.ant-select')
      .find('.ant-select-selection-overflow-item:not(.ant-select-selection-overflow-item-suffix)')
      .should('have.length', count);
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
   * Change the subscription plan to a different option than the current one and
   * yield the newly selected label (for persistence assertions).
   *
   * The dropdown does NOT mark the active option with `-selected`, so we compare
   * each option's text against the current value to find a genuinely different
   * one (picking by index could re-select the current plan and change nothing).
   */
  changeSubscriptionPlan(): Cypress.Chainable<string> {
    const result = { plan: '' };
    this.root
      .find(selectors.partners.form.subscriptionSelect)
      .closest('.ant-select')
      .find(selectors.antd.selectionItem)
      .invoke('text')
      .then((currentText) => {
        const current = currentText.trim();
        cy.get(selectors.partners.form.subscriptionSelect).click({ force: true });
        this.openDropdown()
          .find(selectors.antd.option)
          .then(($opts) => {
            const target = [...$opts].find((el) => el.textContent!.trim() !== current);
            result.plan = target!.textContent!.trim();
            cy.wrap(target).click({ force: true });
          });
      });
    return cy.then(() => result.plan);
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

  /**
   * Yield the current logo preview image's `src`. The saved logo renders as an
   * `<img alt="placeholder">` whose src points at the uploaded file on S3, so
   * comparing it before/after a re-upload proves the new image really persisted.
   */
  getLogoSrc(): Cypress.Chainable<string> {
    return this.root
      .find(selectors.partners.form.logoPreview)
      .should('have.attr', 'src')
      .then((src) => `${src}`);
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

  /** Click Save without expecting a network request (for negative/validation tests). */
  clickSave(): this {
    cy.get(selectors.partners.form.saveButton).click();
    return this;
  }

  /** Assert an inline field-validation message is shown on the form. */
  assertValidationError(message: string): this {
    // The message TEXT is the stable contract (the wrapper uses hashed
    // CSS-module classes and animates in), so we assert the text exists within
    // the modal rather than coupling to an unstable class or animation state.
    this.root.contains(message).should('exist');
    return this;
  }

  cancel(): void {
    cy.get(selectors.partners.form.cancelButton).click();
  }
}
