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
