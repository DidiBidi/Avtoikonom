// Global support file, loaded before every spec file.
import './commands';

/**
 * The application is a Google-Maps-heavy SPA that emits benign console errors
 * (e.g. Push API in incognito, Maps deprecation warnings). These are unrelated
 * to our flows, so we prevent them from failing tests while still surfacing
 * genuine application errors.
 */
Cypress.on('uncaught:exception', (err) => {
  const ignorePatterns = ['ResizeObserver loop', 'Push API', 'google.maps', 'Maps JavaScript API'];
  if (ignorePatterns.some((pattern) => err.message.includes(pattern))) {
    return false;
  }
  return true;
});
