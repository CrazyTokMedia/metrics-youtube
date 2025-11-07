/**
 * YouTube Treatment Comparison Helper - Content Script
 * Phase 1: Manual Helper - Calculate date ranges and display them
 */

// Suppress YouTube Studio's annoying console errors and warnings
(function() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  const shouldSuppress = (args) => {
    const message = JSON.stringify(args).toLowerCase();
    return message.includes('could not get metadata') ||
           message.includes('videometadataprovider') ||
           message.includes('requeststorageaccessfor') ||
           message.includes('feedback-pa.clients6.google.com') ||
           message.includes('gapi.loaded');
  };

  console.error = function(...args) {
    if (shouldSuppress(args)) return;
    originalError.apply(console, args);
  };

  console.warn = function(...args) {
    if (shouldSuppress(args)) return;
    originalWarn.apply(console, args);
  };

  console.log = function(...args) {
    if (shouldSuppress(args)) return;
    originalLog.apply(console, args);
  };
})();

// ============================================================
// GLOBAL ERROR HANDLING & CLEANUP
// ============================================================

// Global error handler for the extension
window.addEventListener('error', (event) => {
  // Only handle errors from our extension code
  const isExtensionError = event.filename &&
    (event.filename.includes('content.js') || event.filename.includes('chrome-extension://'));

  if (isExtensionError) {
    console.error('🔴 Extension error caught:', event.error?.message || event.message);
    console.error('Stack:', event.error?.stack);

    // Log error to logger
    if (window.ExtensionLogger) {
      window.ExtensionLogger.logError('Global error caught', event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    }

    // Try to show user-friendly error
    try {
      const extractBtn = document.getElementById('auto-extract-btn');
      if (extractBtn && extractBtn.disabled) {
        extractBtn.disabled = false;
        extractBtn.classList.remove('disabled');
        const originalText = extractBtn.textContent;
        extractBtn.innerHTML = '<span class="btn-icon">⚠️</span> Error - Click to Retry';

        // Restore original text after 5 seconds
        setTimeout(() => {
          extractBtn.innerHTML = '<span class="btn-icon">📊</span> Extract Metrics';
        }, 5000);
      }
    } catch (e) {
      // If we can't update UI, just log
      console.error('Could not update UI after error:', e);
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logError('Failed to update UI after error', e);
      }
    }

    // Prevent default browser error handling for our errors
    event.preventDefault();
  }
});

// Cleanup function for extension unload/disable
const cleanup = () => {
  console.log('🧹 Cleaning up extension...');

  // Disconnect any MutationObservers
  if (window.extensionObservers && window.extensionObservers.length > 0) {
    window.extensionObservers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (e) {
        console.warn('Could not disconnect observer:', e);
      }
    });
    window.extensionObservers = [];
  }

  // Remove UI elements
  const panel = document.getElementById('yt-treatment-helper');
  if (panel) panel.remove();

  const toggle = document.querySelector('.treatment-helper-toggle');
  if (toggle) toggle.remove();

  console.log('✅ Cleanup complete');
};

// Store observers globally for cleanup
window.extensionObservers = window.extensionObservers || [];

// Helper: Register observer for cleanup
function registerObserver(observer) {
  window.extensionObservers.push(observer);
  return observer;
}

// Listen for extension disable/unload
if (chrome.runtime && chrome.runtime.onSuspend) {
  chrome.runtime.onSuspend.addListener(cleanup);
}

// Check if extension context is still valid
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

// // Helper: Wait for element to appear in DOM
// function waitForElement(selector, timeout = 10000) {
//   return new Promise((resolve, reject) => {
//     const startTime = Date.now();

//     // Check if element already exists
//     const existing = document.querySelector(selector);
//     if (existing) {
//       resolve(existing);
//       return;
//     }

//     // Set up MutationObserver to watch for element
//     const observer = new MutationObserver((mutations, obs) => {
//       const element = document.querySelector(selector);
//       if (element) {
//         obs.disconnect();
//         resolve(element);
//       } else if (Date.now() - startTime > timeout) {
//         obs.disconnect();
//         reject(new Error(`Timeout waiting for element: ${selector}`));
//       }
//     });

//     observer.observe(document.body, {
//       childList: true,
//       subtree: true
//     });

//     // Also poll as backup (some changes might not trigger mutations)
//     const pollInterval = setInterval(() => {
//       const element = document.querySelector(selector);
//       if (element) {
//         clearInterval(pollInterval);
//         observer.disconnect();
//         resolve(element);
//       } else if (Date.now() - startTime > timeout) {
//         clearInterval(pollInterval);
//         observer.disconnect();
//         reject(new Error(`Timeout waiting for element: ${selector}`));
//       }
//     }, 100);
//   });
// }

// // Helper: Wait for element to disappear from DOM
// function waitForElementRemoval(selector, timeout = 5000) {
//   return new Promise((resolve, reject) => {
//     const startTime = Date.now();

//     // Check if element already gone
//     const existing = document.querySelector(selector);
//     if (!existing) {
//       resolve();
//       return;
//     }

//     // Set up MutationObserver to watch for removal
//     const observer = new MutationObserver((mutations, obs) => {
//       const element = document.querySelector(selector);
//       if (!element) {
//         obs.disconnect();
//         resolve();
//       } else if (Date.now() - startTime > timeout) {
//         obs.disconnect();
//         reject(new Error(`Timeout waiting for element removal: ${selector}`));
//       }
//     });

//     observer.observe(document.body, {
//       childList: true,
//       subtree: true
//     });

//     // Also poll as backup
//     const pollInterval = setInterval(() => {
//       const element = document.querySelector(selector);
//       if (!element) {
//         clearInterval(pollInterval);
//         observer.disconnect();
//         resolve();
//       } else if (Date.now() - startTime > timeout) {
//         clearInterval(pollInterval);
//         observer.disconnect();
//         reject(new Error(`Timeout waiting for element removal: ${selector}`));
//       }
//     }, 100);
//   });
// }

// // Helper: Wait for URL to match pattern
// function waitForUrlChange(urlPattern, timeout = 10000) {
//   return new Promise((resolve, reject) => {
//     const startTime = Date.now();

//     // Check if URL already matches
//     if (window.location.href.includes(urlPattern)) {
//       resolve();
//       return;
//     }

//     // Poll for URL change
//     const pollInterval = setInterval(() => {
//       if (window.location.href.includes(urlPattern)) {
//         clearInterval(pollInterval);
//         resolve();
//       } else if (Date.now() - startTime > timeout) {
//         clearInterval(pollInterval);
//         reject(new Error(`Timeout waiting for URL pattern: ${urlPattern}`));
//       }
//     }, 100);
//   });
// }

// Safe chrome.storage wrapper with error handling
const safeStorage = {
  get: async (keys) => {
    if (!isExtensionContextValid()) {
      console.warn('Extension context invalidated. Please reload the page.');
      return {};
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            console.warn('Storage get error:', chrome.runtime.lastError);
            resolve({});
          } else {
            resolve(result);
          }
        });
      } catch (e) {
        console.warn('Storage get exception:', e);
        resolve({});
      }
    });
  },

  set: async (data) => {
    if (!isExtensionContextValid()) {
      console.warn('Extension context invalidated. Cannot save data.');
      return false;
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            console.warn('Storage set error:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      } catch (e) {
        console.warn('Storage set exception:', e);
        resolve(false);
      }
    });
  }
};

// ============================================================
// UTILITY FUNCTION ALIASES (use namespace implementations)
// ============================================================
// These aliases allow existing code to work while using the modular implementations

// DOM utilities
const waitForElement = (selector, timeout) => YTTreatmentHelper.Utils.waitForElement(selector, timeout);
const waitForElementRemoval = (selector, timeout) => YTTreatmentHelper.Utils.waitForElementRemoval(selector, timeout);
const waitForUrlChange = (urlPattern, timeout) => YTTreatmentHelper.Utils.waitForUrlChange(urlPattern, timeout);

// Date formatting
const formatDate = (date) => YTTreatmentHelper.Utils.formatDate(date);
const formatDateDisplay = (dateStr) => YTTreatmentHelper.Utils.formatDateDisplay(dateStr);
const formatDateToDDMMYYYY = (dateStr) => YTTreatmentHelper.Utils.formatDateToDDMMYYYY(dateStr);
const formatDateToYYYYMMDD = (dateStr) => YTTreatmentHelper.Utils.formatDateToYYYYMMDD(dateStr);
const autoFormatDateInput = (input) => YTTreatmentHelper.Utils.autoFormatDateInput(input);

// Video ID
const getVideoIdFromUrl = () => YTTreatmentHelper.Utils.getVideoIdFromUrl();

// YouTube API functions
const getVideoPublishDate = () => YTTreatmentHelper.API.getVideoPublishDate();
const calculateDateRanges = (treatmentDate, videoPublishDate) => YTTreatmentHelper.API.calculateDateRanges(treatmentDate, videoPublishDate);
const isOnAnalyticsTab = () => YTTreatmentHelper.API.isOnAnalyticsTab();
const isOnAdvancedMode = () => YTTreatmentHelper.API.isOnAdvancedMode();

// Navigation functions
const closeAdvancedMode = () => YTTreatmentHelper.API.closeAdvancedMode();
const navigateToAnalyticsTab = () => YTTreatmentHelper.API.navigateToAnalyticsTab();
const navigateToAdvancedMode = () => YTTreatmentHelper.API.navigateToAdvancedMode();
const navigateToAudienceRetention = () => YTTreatmentHelper.API.navigateToAudienceRetention();
const navigateBackToMetrics = () => YTTreatmentHelper.API.navigateBackToMetrics();

// Date setting functions
const setCustomDateRange = (startDate, endDate, overrideFormat) => YTTreatmentHelper.API.setCustomDateRange(startDate, endDate, overrideFormat);
const setCustomDateRangeWithRetry = (startDate, endDate) => YTTreatmentHelper.API.setCustomDateRangeWithRetry(startDate, endDate);

// Extraction functions
const selectMetrics = () => YTTreatmentHelper.API.selectMetrics();
const extractValues = () => YTTreatmentHelper.API.extractValues();
const extractRetentionMetric = () => YTTreatmentHelper.API.extractRetentionMetric();

// Orchestration function
const extractPrePostMetrics = (preStart, preEnd, postStart, postEnd, statusCallback, includeRetention) =>
  YTTreatmentHelper.API.extractPrePostMetrics(preStart, preEnd, postStart, postEnd, statusCallback, includeRetention);

// ============================================================
// LEGACY FUNCTION DECLARATIONS (to be removed in Phase 5)
// ============================================================
// Keeping these commented out for now - using aliases above instead

// // Utility: Format date as YYYY-MM-DD (for internal use)
// function formatDate(date) {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }

// // Utility: Format date as DD/MM/YY (for display)
// function formatDateDisplay(dateStr) {
//   // Input: "2025-10-24" (YYYY-MM-DD)
//   // Output: "24/10/25" (DD/MM/YY)
//   const [year, month, day] = dateStr.split('-');
//   const shortYear = year.slice(-2);
//   return `${day}/${month}/${shortYear}`;
// }

// // Helper: Get video publish date from page
// function getVideoPublishDate() {
//   // Implementation moved to content-youtube-api.js
// }

// // Core Logic: Calculate PRE and POST date ranges
// function calculateDateRanges(treatmentDate, videoPublishDate = null) {
//   // Implementation moved to content-youtube-api.js
// }

// ============================================================
// PHASE 2: AUTOMATIC METRICS EXTRACTION
// ============================================================

// Helper: Set Custom Date Range
// async function setCustomDateRange(startDate, endDate, overrideFormat = null) {
//   // Implementation moved to content-youtube-api.js
// }

// Alias: Make panel draggable (migrated to content-single-video.js)
function makePanelDraggable(panel) {
  return YTTreatmentHelper.SingleVideo.makePanelDraggable(panel);
}

// // Helper: Convert YYYY-MM-DD to DD/MM/YYYY
// function formatDateToDDMMYYYY(dateStr) {
//   if (!dateStr) return '';
//   const [year, month, day] = dateStr.split('-');
//   return `${day}/${month}/${year}`;
// }

// // Helper: Convert DD/MM/YYYY to YYYY-MM-DD
// function formatDateToYYYYMMDD(dateStr) {
//   if (!dateStr) return '';
//   const parts = dateStr.split('/');
//   if (parts.length !== 3) return '';
//   const [day, month, year] = parts;
//   return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
// }

// // Helper: Auto-format date input as user types
// function autoFormatDateInput(input) {
//   // Prevent adding listeners multiple times
//   if (input.dataset.formattingApplied === 'true') {
//     return;
//   }
//   input.dataset.formattingApplied = 'true';

//   input.addEventListener('input', (e) => {
//     let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

//     if (value.length >= 2) {
//       value = value.slice(0, 2) + '/' + value.slice(2);
//     }
//     if (value.length >= 5) {
//       value = value.slice(0, 5) + '/' + value.slice(5, 9);
//     }

//     e.target.value = value;
//   });

//   // Validate on blur
//   input.addEventListener('blur', (e) => {
//     const value = e.target.value;
//     if (!value) return;

//     const parts = value.split('/');
//     if (parts.length !== 3) {
//       e.target.style.borderColor = 'red';
//       return;
//     }

//     const [day, month, year] = parts.map(p => parseInt(p));
//     if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
//       e.target.style.borderColor = 'red';
//     } else {
//       e.target.style.borderColor = '';
//     }
//   });
// }

// UI: Create floating panel

// Alias: Create helper panel (migrated to content-single-video.js)
function createHelperPanel() {
  return YTTreatmentHelper.SingleVideo.createHelperPanel();
}

// Alias: Add toggle button (migrated to content-single-video.js)
function addToggleButton() {
  return YTTreatmentHelper.SingleVideo.addToggleButton();
}

// // Helper: Extract video ID from URL
// function getVideoIdFromUrl() {
//   const match = window.location.pathname.match(/\/video\/([^\/]+)\//);
//   return match ? match[1] : null;
// }

// Alias: Reset form when video changes (migrated to content-single-video.js)
function resetFormForNewVideo() {
  return YTTreatmentHelper.SingleVideo.resetFormForNewVideo();
}

// Alias: Watch for video changes (migrated to content-single-video.js)
function watchForVideoChanges() {
  return YTTreatmentHelper.SingleVideo.watchForVideoChanges();
}

// Alias: Initialize (migrated to content-single-video.js)
async function init() {
  // Initialize single video helper
  YTTreatmentHelper.SingleVideo.init();

  // Check if batch extraction is in progress and resume if needed
  await YTTreatmentHelper.BatchMode.checkAndResumeBatch();
}

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Listen for messages from popup to toggle panel visibility
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'togglePanel') {
    const panel = document.getElementById('yt-treatment-helper');
    if (panel) {
      panel.style.display = message.visible ? 'block' : 'none';
    } else if (message.visible) {
      // Create panel if it doesn't exist and we want to show it
      createHelperPanel();
    }
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});
