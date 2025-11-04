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
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Check if element already exists
      const existing = document.querySelector(selector);
      if (existing) {
        resolve(existing);
        return;
      }

      // Set up MutationObserver to watch for element
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          obs.disconnect();
          reject(new Error(`Timeout waiting for element: ${selector}`));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Also poll as backup (some changes might not trigger mutations)
      const pollInterval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(pollInterval);
          observer.disconnect();
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(pollInterval);
          observer.disconnect();
          reject(new Error(`Timeout waiting for element: ${selector}`));
        }
      }, 100);
    });
  },

  /**
   * Wait for element to disappear from DOM
   */
  waitForElementRemoval: function(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Check if element already gone
      const existing = document.querySelector(selector);
      if (!existing) {
        resolve();
        return;
      }

      // Set up MutationObserver to watch for removal
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (!element) {
          obs.disconnect();
          resolve();
        } else if (Date.now() - startTime > timeout) {
          obs.disconnect();
          reject(new Error(`Timeout waiting for element removal: ${selector}`));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Also poll as backup
      const pollInterval = setInterval(() => {
        const element = document.querySelector(selector);
        if (!element) {
          clearInterval(pollInterval);
          observer.disconnect();
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(pollInterval);
          observer.disconnect();
          reject(new Error(`Timeout waiting for element removal: ${selector}`));
        }
      }, 100);
    });
  },

  /**
   * Wait for URL to change
   */
  waitForUrlChange: function(urlPattern, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Check if URL already matches
      if (window.location.href.includes(urlPattern)) {
        resolve();
        return;
      }

      // Poll for URL change
      const pollInterval = setInterval(() => {
        if (window.location.href.includes(urlPattern)) {
          clearInterval(pollInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(pollInterval);
          reject(new Error(`Timeout waiting for URL pattern: ${urlPattern}`));
        }
      }, 100);
    });
  },

  /**
   * Date formatting utilities
   */

  // Format date as DD/MM/YYYY
  formatDateToDDMMYYYY: function(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  },

  // Convert DD/MM/YYYY to YYYY-MM-DD
  formatDateToYYYYMMDD: function(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  },

  // Format Date object as YYYY-MM-DD
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Format date as DD/MM/YY (for display)
  formatDateDisplay: function(dateStr) {
    // Input: "2025-10-24" (YYYY-MM-DD)
    // Output: "24/10/25" (DD/MM/YY)
    const [year, month, day] = dateStr.split('-');
    const shortYear = year.slice(-2);
    return `${day}/${month}/${shortYear}`;
  },

  /**
   * Auto-format date input as user types
   */
  autoFormatDateInput: function(input) {
    // Prevent adding listeners multiple times
    if (input.dataset.formattingApplied === 'true') {
      return;
    }
    input.dataset.formattingApplied = 'true';

    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      }
      if (value.length >= 5) {
        value = value.slice(0, 5) + '/' + value.slice(5, 9);
      }

      e.target.value = value;
    });

    // Validate on blur
    input.addEventListener('blur', (e) => {
      const value = e.target.value;
      if (!value) return;

      const parts = value.split('/');
      if (parts.length !== 3) {
        e.target.style.borderColor = 'red';
        return;
      }

      const [day, month, year] = parts.map(p => parseInt(p));
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
        e.target.style.borderColor = 'red';
      } else {
        e.target.style.borderColor = '';
      }
    });
  },

  /**
   * Get video ID from current URL
   */
  getVideoIdFromUrl: function() {
    const match = window.location.pathname.match(/\/video\/([^\/]+)\//);
    return match ? match[1] : null;
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
