/**
 * YouTube Treatment Comparison Helper - Entry Point
 * Modular version with webpack
 */

// Import error handling first
import './errorHandling.js';

// Import UI
import { createPanel, createToggleButton } from './ui/panel.js';

// ============================================================
// GLOBAL SETUP
// ============================================================

// Store observers globally for cleanup
window.extensionObservers = window.extensionObservers || [];

/**
 * Register a MutationObserver for cleanup
 */
export function registerObserver(observer) {
  window.extensionObservers.push(observer);
  return observer;
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize the extension
 */
function init() {
  console.log('YouTube Treatment Comparison Helper loaded');

  // Create UI
  createToggleButton();
  createPanel();

  console.log('Extension initialized successfully');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
