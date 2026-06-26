/**
 * Central selector registry.
 *
 * Why a registry instead of inline selectors?
 * - One place to update when the UI changes (maintainability).
 * - Documents the selector strategy for the team.
 *
 * Selector strategy (most → least preferred):
 *   1. Stable element ids exposed by the app (e.g. `#name-field`). The Partner
 *      form exposes semantic ids, so we lean on them heavily.
 *   2. Stable framework hooks (Ant Design structural classes) when no id exists.
 *   3. Accessible text / placeholders for buttons and menu items.
 *
 * The app currently ships no `data-test` attributes. If/when the team adds them,
 * only this file needs to change — page objects and specs stay untouched.
 */
export const selectors = {
  login: {
    // The login form exposes no ids; anchor on the two textboxes and the submit button.
    emailInput: '.ant-input, input[type="text"], input[type="email"]',
    passwordInput: 'input[type="password"]',
    submitButton: 'button:contains("Логин"), button:contains("Login")',
  },

  layout: {
    pageHeaderTitle: 'header, [class*="header"]',
    userEmail: '[class*="header"]',
  },

  partners: {
    list: {
      newPartnerButton: 'button:contains("New partner")',
      searchInput: 'input[placeholder*="Search by partners"]',
      table: 'table',
      row: 'tbody tr',
      // The per-row actions menu is an Ant "submenu" trigger holding a dots icon.
      rowActionsTrigger: 'img[alt="dots-icon"]',
      resultsSummary: '*:contains("results")',
    },
    rowMenu: {
      // Rendered in a portal at the document root.
      edit: '.ant-dropdown-menu-item:contains("Edit"), li:contains("Edit")',
      editFallback: 'li:contains("Edit")',
      delete: 'li:contains("Delete")',
    },
    form: {
      modal: '.ant-modal-content',
      nameInput: '#name-field',
      typeSelect: '#partner-type-field',
      servicesSelect: '#service-types-field',
      subscriptionSelect: '#subscription-tier-field',
      addressInput: '#address-field',
      phoneCountrySelect: 'select[name="phoneCountry"]',
      phoneInput: '#phone-field',
      contactPersonInput: '#contact-person-field',
      descriptionInput: '#description-field',
      logoInput: 'input[type="file"][name="file-upload"]',
      hideCheckbox: '#checkbox-hide',
      // Scope to the modal that actually contains the form, so the photo
      // cropper's own Save/Cancel buttons are never matched by mistake.
      saveButton: '.ant-modal-content:has(#name-field) button:contains("Save")',
      cancelButton: '.ant-modal-content:has(#name-field) button:contains("Cancel")',
    },
    // Uploading a logo opens a separate "Edit photo" cropper modal that must be
    // confirmed before the image is applied to the form.
    photoCropper: {
      modal: '.ant-modal-content:contains("Edit photo")',
      saveButton: '.ant-modal-content:contains("Edit photo") button:contains("Save")',
    },
  },

  antd: {
    // Visible (non-hidden) dropdown panel rendered in a portal.
    openDropdown: '.ant-select-dropdown:not(.ant-select-dropdown-hidden)',
    option: '.ant-select-item-option',
    selectionItem: '.ant-select-selection-item',
  },

  // Google Places Autocomplete suggestion list (appended to <body>).
  googlePlaces: {
    container: '.pac-container',
    item: '.pac-item',
  },
} as const;
