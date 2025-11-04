/**
 * YouTube Treatment Comparison Helper - Utilities Module
 * Shared utility functions used across all modules
 */

// Create global namespace
window.YTTreatmentHelper = window.YTTreatmentHelper || {};

// Utility functions
YTTreatmentHelper.Utils = {
  /**
   * Wait for element to appear in DOM
   */
  waitForElement: function(selector, timeout = 10000) {
    // Implementation will be migrated from content.js
    return new Promise((resolve, reject) => {
      reject(new Error('Not yet implemented - to be migrated'));
    });
  },

  /**
   * Wait for element to disappear from DOM
   */
  waitForElementRemoval: function(selector, timeout = 5000) {
    // Implementation will be migrated from content.js
    return new Promise((resolve, reject) => {
      reject(new Error('Not yet implemented - to be migrated'));
    });
  },

  /**
   * Wait for URL to change
   */
  waitForUrlChange: function(urlPattern, timeout = 10000) {
    // Implementation will be migrated from content.js
    return new Promise((resolve, reject) => {
      reject(new Error('Not yet implemented - to be migrated'));
    });
  },

  /**
   * Date formatting utilities
   */
  formatDateToDDMMYYYY: function(dateStr) {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  formatDateToYYYYMMDD: function(dateStr) {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  formatDate: function(date) {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  formatDateDisplay: function(dateStr) {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  /**
   * Auto-format date input as user types
   */
  autoFormatDateInput: function(input) {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  /**
   * Get video ID from current URL
   */
  getVideoIdFromUrl: function() {
    // Implementation will be migrated from content.js
    return null;
  },

  /**
   * Check if extension context is still valid
   */
  isExtensionContextValid: function() {
    // Implementation will be migrated from content.js
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  },

  /**
   * Page detection utilities
   */
  isVideoAnalyticsPage: function() {
    return window.location.href.includes('/video/') &&
           window.location.href.includes('/analytics');
  },

  isAnalyticsHomePage: function() {
    return window.location.href.includes('/analytics') &&
           !window.location.href.includes('/video/');
  },

  /**
   * Observer management
   */
  registerObserver: function(observer) {
    window.extensionObservers = window.extensionObservers || [];
    window.extensionObservers.push(observer);
    return observer;
  }
};

console.log('Utils module loaded');
