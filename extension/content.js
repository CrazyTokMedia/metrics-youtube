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
async function setCustomDateRange_MIGRATED_TO_API(startDate, endDate, overrideFormat = null) {
  console.log(`Setting date range: ${startDate} to ${endDate}${overrideFormat ? ` (forced format: ${overrideFormat})` : ''}`);

  const sidebar = document.querySelector('yta-explore-sidebar');
  if (!sidebar) throw new Error('Sidebar not found');

  let dateTrigger = null;

  // Check if we're on Audience Retention page (has yta-time-picker)
  const timePicker = sidebar.querySelector('yta-time-picker');
  if (timePicker) {
    console.log('Found yta-time-picker (Audience Retention page)');
    dateTrigger = timePicker.querySelector('ytcp-dropdown-trigger');
  } else {
    // Regular Content page - find date dropdown trigger
    console.log('Looking for regular dropdown trigger (Content page)');
    const triggers = sidebar.querySelectorAll('ytcp-dropdown-trigger');
    for (const trigger of triggers) {
      const text = trigger.textContent;
      if (text.includes('–') || text.includes('Since') || text.includes('days')) {
        dateTrigger = trigger;
        break;
      }
    }
  }

  if (!dateTrigger) throw new Error('Date trigger not found');

  console.log(`Found date trigger with text: "${dateTrigger.textContent.substring(0, 50).trim()}..."`);

  // Close any existing dropdown first
  const existingDropdown = document.querySelector('tp-yt-paper-listbox[role="listbox"]');
  if (existingDropdown) {
    console.log('Closing existing dropdown first...');
    // Click outside to close
    document.body.click();
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Ensure the trigger is visible and scrolled into view
  dateTrigger.scrollIntoView({ behavior: 'instant', block: 'center' });
  await new Promise(resolve => setTimeout(resolve, 100));

  // Helper: Check if element is truly visible
  const isElementVisible = (element) => {
    if (!element) return false;

    // Check 1: Basic offsetParent
    if (!element.offsetParent) return false;

    // Check 2: Computed style
    const style = window.getComputedStyle(element);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;

    // Check 3: Has dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    return true;
  };

  // Focus and click the trigger to open dropdown
  dateTrigger.focus();
  await new Promise(resolve => setTimeout(resolve, 50));
  dateTrigger.click();
  console.log('Clicked date trigger, waiting for dropdown menu...');

  // Wait for dropdown using MutationObserver + polling (more robust)
  console.log('Waiting for dropdown menu to appear...');
  let visibleDropdown = null;

  // Helper: Check if dropdown is the DATE dropdown (not metrics or other dropdowns)
  const isDateDropdown = (dropdown) => {
    if (!dropdown) return false;

    // EXCLUDE metrics card dropdown - these have "yta-key-metric-card" in their items
    const items = dropdown.querySelectorAll('tp-yt-paper-item');
    for (const item of items) {
      const className = item.className || '';
      if (className.includes('yta-key-metric-card')) {
        console.log('Excluding dropdown: contains yta-key-metric-card items (metrics selector)');
        return false;
      }
    }

    // Check 1: Look for ytcp-text-menu parent (date dropdowns have this)
    const hasTextMenuParent = dropdown.closest('ytcp-text-menu') !== null;
    if (hasTextMenuParent) {
      console.log('Found date dropdown: has ytcp-text-menu parent');
      return true;
    }

    // Check 2: Look for date-related text in the options
    const dateKeywords = ['custom', 'last', 'days', 'week', 'month', 'since', 'published', 'uploaded'];

    for (const item of items) {
      const text = item.textContent.toLowerCase();
      // Check if text contains date keywords but NOT metric keywords
      const hasDateKeyword = dateKeywords.some(keyword => text.includes(keyword));
      const hasMetricKeyword = text.includes('views') || text.includes('watch time') || text.includes('subscribers');

      if (hasDateKeyword && !hasMetricKeyword) {
        console.log('Found date dropdown: contains date-related options');
        return true;
      }
    }

    console.log('Not a date dropdown');
    return false;
  };

  try {
    visibleDropdown = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        observer.disconnect();
        reject(new Error('Dropdown did not appear within 3 seconds'));
      }, 3000);

      // MutationObserver to detect dropdown appearance
      const observer = new MutationObserver(() => {
        const dropdowns = document.querySelectorAll('tp-yt-paper-listbox[role="listbox"]');
        for (const dropdown of dropdowns) {
          if (isElementVisible(dropdown) && isDateDropdown(dropdown)) {
            clearTimeout(timeout);
            observer.disconnect();
            console.log('Dropdown detected via MutationObserver');
            resolve(dropdown);
            return;
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });

      // Also poll as backup (in case mutation doesn't trigger)
      const pollInterval = setInterval(() => {
        const dropdowns = document.querySelectorAll('tp-yt-paper-listbox[role="listbox"]');
        for (const dropdown of dropdowns) {
          if (isElementVisible(dropdown) && isDateDropdown(dropdown)) {
            clearTimeout(timeout);
            clearInterval(pollInterval);
            observer.disconnect();
            console.log('Dropdown detected via polling');
            resolve(dropdown);
            return;
          }
        }
      }, 100);
    });
  } catch (error) {
    // If we can't detect the dropdown but can find "Custom" option, proceed anyway
    console.warn('Could not detect dropdown visibility, attempting to find Custom option anyway...');
    const allDropdowns = document.querySelectorAll('tp-yt-paper-listbox[role="listbox"]');
    for (const dropdown of allDropdowns) {
      if (isDateDropdown(dropdown)) {
        console.log('Found date dropdown, proceeding...');
        visibleDropdown = dropdown;
        break;
      }
    }

    if (!visibleDropdown) {
      console.error('No date dropdown appeared after clicking date trigger');
      throw new Error('Date dropdown did not open');
    }
  }

  // Now find the custom option in the VISIBLE dropdown
  // Try multiple strategies to find the "Custom" option
  let customOption = null;

  // Strategy 1: Look for test-id="fixed" (legacy selector)
  customOption = visibleDropdown.querySelector('tp-yt-paper-item[test-id="fixed"]');

  if (!customOption) {
    // Strategy 2: Look for yt-formatted-string containing "Custom"
    const formattedStrings = visibleDropdown.querySelectorAll('yt-formatted-string');
    for (const str of formattedStrings) {
      if (str.textContent.trim().toLowerCase() === 'custom') {
        // Navigate up to the tp-yt-paper-item parent
        customOption = str.closest('tp-yt-paper-item');
        if (customOption) {
          console.log('Found Custom option via yt-formatted-string');
          break;
        }
      }
    }
  }

  if (!customOption) {
    // Strategy 3: Look for tp-yt-paper-item with text content "Custom"
    console.log('Trying to find Custom option by text content...');
    const allItems = visibleDropdown.querySelectorAll('tp-yt-paper-item');
    console.log(`Found ${allItems.length} items in date dropdown:`,
      Array.from(allItems).map(o => o.textContent.trim().substring(0, 30)));

    for (const item of allItems) {
      const text = item.textContent.trim().toLowerCase();
      // Match exactly "custom" or "custom..." but not longer phrases
      if (text === 'custom' || text.startsWith('custom') && text.length < 20) {
        customOption = item;
        console.log('Found Custom option by text content match');
        break;
      }
    }
  }

  if (!customOption) {
    // Wait a bit and retry all strategies
    console.log('Custom option not found, waiting 1 second and retrying...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Retry all strategies
    customOption = visibleDropdown.querySelector('tp-yt-paper-item[test-id="fixed"]');

    if (!customOption) {
      const formattedStrings = visibleDropdown.querySelectorAll('yt-formatted-string');
      for (const str of formattedStrings) {
        if (str.textContent.trim().toLowerCase() === 'custom') {
          customOption = str.closest('tp-yt-paper-item');
          if (customOption) break;
        }
      }
    }

    if (!customOption) {
      const allItems = visibleDropdown.querySelectorAll('tp-yt-paper-item');
      for (const item of allItems) {
        const text = item.textContent.trim().toLowerCase();
        if (text === 'custom' || text.startsWith('custom') && text.length < 20) {
          customOption = item;
          break;
        }
      }
    }
  }

  if (!customOption) {
    // Enhanced debugging: log all attributes and properties of each option
    const allItems = visibleDropdown.querySelectorAll('tp-yt-paper-item');
    const optionDetails = Array.from(allItems).map((o, index) => {
      const attrs = {};
      // Get all attributes
      for (const attr of o.attributes) {
        attrs[attr.name] = attr.value;
      }
      return {
        index,
        tagName: o.tagName,
        text: o.textContent.trim().substring(0, 100),
        innerHTML: o.innerHTML.substring(0, 100), // First 100 chars
        attributes: attrs,
        className: o.className,
        id: o.id
      };
    });

    console.error('Custom option still not found after retry. Available options:',
      JSON.stringify(optionDetails, null, 2));
    console.error('Raw dropdown HTML:', visibleDropdown.innerHTML.substring(0, 500));

    throw new Error('Custom date option not found in dropdown. The page may not be fully loaded. Please refresh and try again.');
  }

  console.log('Custom option found in visible dropdown');

  customOption.click();
  await new Promise(resolve => setTimeout(resolve, 800));

  // Find the VISIBLE date picker (not just any in DOM)
  // This is critical because multiple pickers can exist from different tabs
  const allDateDialogs = document.querySelectorAll('ytcp-date-period-picker');
  let dateDialog = null;

  for (const dialog of allDateDialogs) {
    // Check if this dialog is actually visible
    if (dialog.offsetParent !== null) {
      dateDialog = dialog;
      console.log('Found VISIBLE date picker dialog');
      break;
    }
  }

  if (!dateDialog) {
    console.error(`Found ${allDateDialogs.length} date pickers but none are visible`);
    throw new Error('No visible date picker found');
  }

  const startInput = dateDialog.querySelector('#start-date input');
  const endInput = dateDialog.querySelector('#end-date input');

  if (!startInput || !endInput) throw new Error('Input elements not found');

  // Get cached values from dialog
  const cachedStart = startInput.value;
  const cachedEnd = endInput.value;
  console.log(`   Dialog opened - pre-filled values: start="${cachedStart}", end="${cachedEnd}"`);

  // Detect date format from YouTube's actual UI instead of browser locale
  const detectYouTubeDateFormat = (sampleDate) => {
    if (!sampleDate || !sampleDate.includes('/')) {
      return null; // Cannot detect format
    }

    const parts = sampleDate.split('/');
    if (parts.length !== 3) {
      return null; // Invalid format
    }

    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);

    // If first part is > 12, it must be the day (DD/MM/YYYY)
    if (first > 12) {
      return 'DD/MM/YYYY';
    }
    // If second part is > 12, it must be the day (MM/DD/YYYY)
    if (second > 12) {
      return 'MM/DD/YYYY';
    }
    // If both are <= 12, we can't determine for certain
    // Fall back to browser locale as best guess
    return null;
  };

  // Use override format if provided, otherwise detect from cached values
  let detectedFormat;

  if (overrideFormat) {
    detectedFormat = overrideFormat;
    console.log(`   Using forced date format: ${detectedFormat}`);
  } else {
    detectedFormat = detectYouTubeDateFormat(cachedStart) || detectYouTubeDateFormat(cachedEnd);

    // If we couldn't detect from cached values, default to DD/MM/YYYY
    if (!detectedFormat) {
      detectedFormat = 'DD/MM/YYYY';
      console.log(`   Could not detect format from cached dates, defaulting to DD/MM/YYYY`);
    } else {
      console.log(`   Detected YouTube date format from UI: ${detectedFormat}`);
    }
  }

  const useDDMMYYYY = detectedFormat === 'DD/MM/YYYY';

  const formatDateForInput = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    // Use DD/MM/YYYY or MM/DD/YYYY based on detection
    if (useDDMMYYYY) {
      return `${day}/${month}/${year}`;
    }
    return `${month}/${day}/${year}`;
  };

  const formattedStart = formatDateForInput(startDate);
  const formattedEnd = formatDateForInput(endDate);

  // Log format being used for debugging
  console.log(`Using date format: ${detectedFormat}`);
  console.log(`Setting dates: ${formattedStart} to ${formattedEnd}`);

  // Function to set date input value
  const setDateInput = async (input, value, label) => {
    console.log(`   Setting ${label}: target="${value}"`);

    // Use native setter to bypass React's getter/setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, value);

    // Trigger events to notify React
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`   After setting: input.value="${input.value}"`);
  };

  // SMART ORDERING: Decide which date to set first based on cached vs target values
  // This prevents YouTube's validation from rejecting changes

  // Helper to parse date string to comparable timestamp
  const parseFullDate = (dateStr) => {
    if (!dateStr) return null;

    // Handle "DD/MM/YYYY" or "MM/DD/YYYY" format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const part1 = parseInt(parts[0]);
        const part2 = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        // Parse based on detected format
        let month, day;
        if (useDDMMYYYY) {
          day = part1;
          month = part2;
        } else {
          month = part1;
          day = part2;
        }

        // Create date (month is 0-indexed in Date constructor)
        return new Date(year, month - 1, day).getTime();
      }
    }

    // Handle "1 Nov 2025" or "16 Oct 2025" format
    const textDateMatch = dateStr.match(/(\d+)\s+(\w+)\s+(\d+)/);
    if (textDateMatch) {
      const day = parseInt(textDateMatch[1]);
      const monthStr = textDateMatch[2];
      const year = parseInt(textDateMatch[3]);

      // Convert month name to number
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                          'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const month = monthNames.findIndex(m => monthStr.toLowerCase().startsWith(m));

      if (month >= 0) {
        return new Date(year, month, day).getTime();
      }
    }

    return null;
  };

  const cachedStartTime = parseFullDate(cachedStart);
  const cachedEndTime = parseFullDate(cachedEnd);
  const targetStartTime = parseFullDate(formattedStart);
  const targetEndTime = parseFullDate(formattedEnd);

  console.log(`   Cached: START=${cachedStart} (${cachedStartTime}), END=${cachedEnd} (${cachedEndTime})`);
  console.log(`   Target: START=${formattedStart} (${targetStartTime}), END=${formattedEnd} (${targetEndTime})`);

  // Decide order based on relationship between cached and target values
  let setEndFirst = true; // Default to END first

  if (cachedStartTime && cachedEndTime && targetStartTime && targetEndTime) {
    // Strategy: Always set the date that's expanding the range FIRST
    // This prevents YouTube's validation from rejecting the change

    // If moving the range forward in time (target START >= cached END)
    if (targetStartTime >= cachedEndTime) {
      setEndFirst = true; // Set END first to expand range upward
      console.log(`   Strategy: END first (expanding forward)`);
    }
    // If moving the range backward in time (target END <= cached START)
    else if (targetEndTime <= cachedStartTime) {
      setEndFirst = false; // Set START first to expand range downward
      console.log(`   Strategy: START first (expanding backward)`);
    }
    // If ranges overlap, check which direction we're primarily moving
    else if (targetStartTime > cachedStartTime) {
      setEndFirst = false; // Moving start forward, set START first
      console.log(`   Strategy: START first (start moving forward)`);
    } else {
      setEndFirst = true; // Moving end or overlapping, set END first
      console.log(`   Strategy: END first (default overlap)`);
    }
  } else {
    console.log(`   Strategy: END first (default - couldn't parse dates)`);
  }

  if (setEndFirst) {
    // Set end date first, then start date
    await setDateInput(endInput, formattedEnd, 'End');
    await setDateInput(startInput, formattedStart, 'Start');
  } else {
    // Set start date first, then end date
    await setDateInput(startInput, formattedStart, 'Start');
    await setDateInput(endInput, formattedEnd, 'End');
  }

  // Wait for React to process
  console.log(`   Waiting 300ms for React to process...`);
  await new Promise(resolve => setTimeout(resolve, 300));

  const applyButton = dateDialog.querySelector('#apply-button');
  if (!applyButton) throw new Error('Apply button not found');

  // FINAL CHECK: Log values RIGHT before clicking Apply
  console.log(`   Final values before Apply:`);
  console.log(`      START: "${startInput.value}"`);
  console.log(`      END: "${endInput.value}"`);
  console.log(`      Apply button disabled: ${applyButton.disabled || applyButton.getAttribute('aria-disabled')}`);

  // Check for validation errors
  const errors = dateDialog.querySelectorAll('.error, [role="alert"], .validation-error');
  const errorMessages = [];

  if (errors.length > 0) {
    console.log(`   ⚠️ VALIDATION ERRORS FOUND:`);
    errors.forEach((err, i) => {
      const errorText = err.textContent.trim();
      console.log(`      ${i + 1}. ${errorText}`);
      if (errorText) {
        errorMessages.push(errorText);
      }
    });
  }

  // If there are real validation errors (not just empty error elements), abort
  if (errorMessages.length > 0) {
    const errorSummary = errorMessages.join('; ');
    console.error(`   ❌ ABORTING: Validation errors prevent date change: ${errorSummary}`);

    // Close the dialog
    const cancelButton = dateDialog.querySelector('#cancel-button, [aria-label="Cancel"]');
    if (cancelButton) {
      cancelButton.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    throw new Error(`YouTube validation failed: ${errorSummary}. The dates you're trying to set are outside YouTube's allowed range. Please check that your dates are not in the future.`);
  }

  // Get the current sidebar date BEFORE clicking Apply
  const getSidebarDateText = () => {
    const triggers = sidebar.querySelectorAll('ytcp-dropdown-trigger');
    for (const trigger of triggers) {
      const text = trigger.textContent;
      if (text.includes('–') || text.includes('Since') || text.includes('days')) {
        return text.trim();
      }
    }
    return '';
  };

  const beforeDate = getSidebarDateText();
  console.log(`   Sidebar before Apply: "${beforeDate}"`);

  // Try multiple click methods
  console.log('   Clicking Apply button...');
  applyButton.focus();
  await new Promise(resolve => setTimeout(resolve, 100));
  applyButton.click();

  // Also try dispatching click event
  applyButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

  // Try clicking the actual button inside if it exists
  const actualButton = applyButton.querySelector('button');
  if (actualButton) {
    console.log('   Also clicking inner button element...');
    actualButton.click();
  }

  // Wait for the date dialog to actually close (check if it becomes hidden)
  console.log('   Waiting for dialog to close...');
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const dialog = document.querySelector('ytcp-date-period-picker');
      if (!dialog || dialog.offsetParent === null) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 5000);
  });

  // Wait for sidebar to actually UPDATE with new dates (poll for change)
  console.log('   Waiting for sidebar to update...');
  let currentDateText = beforeDate;
  const maxWait = 30; // 30 attempts x 200ms = 6 seconds

  for (let i = 0; i < maxWait; i++) {
    await new Promise(resolve => setTimeout(resolve, 200));
    currentDateText = getSidebarDateText();

    // Check if sidebar changed from the before date
    if (currentDateText !== beforeDate) {
      console.log(`   Sidebar updated after ${(i + 1) * 200}ms`);
      break;
    }
  }

  if (currentDateText === beforeDate) {
    console.log(`   ⚠️ WARNING: Sidebar did not change after ${maxWait * 200}ms`);
  }

  console.log(`✅ Date range applied successfully!`);
  console.log(`   Requested: ${formattedStart} - ${formattedEnd}`);
  console.log(`   Sidebar shows: "${currentDateText}"`);

  // Verify the dates were actually applied
  const requestedDates = `${formattedStart} - ${formattedEnd}`;
  const normalizeDate = (str) => str.replace(/\s+/g, ' ').toLowerCase();

  // Extract day numbers from formatted dates (e.g., "12" from "12/10/2025")
  // Parse as integers to strip leading zeros ("05" becomes "5")
  const startDay = parseInt(formattedStart.split('/')[0]).toString();
  const endDay = parseInt(formattedEnd.split('/')[0]).toString();

  // Check if both start and end dates are in the sidebar text
  const sidebarNormalized = normalizeDate(currentDateText);
  const hasStartDate = sidebarNormalized.includes(startDay);
  const hasEndDate = sidebarNormalized.includes(endDay);

  console.log(`   Checking dates: start day "${startDay}" found: ${hasStartDate}, end day "${endDay}" found: ${hasEndDate}`);

  if (!hasStartDate || !hasEndDate) {
    console.error(`⚠️ ERROR: Dates were NOT applied correctly!`);
    console.error(`   Requested: ${formattedStart} - ${formattedEnd} (days: ${startDay} to ${endDay})`);
    console.error(`   Sidebar shows: "${currentDateText}"`);
    console.error(`   Missing: ${!hasStartDate ? 'START date' : ''} ${!hasEndDate ? 'END date' : ''}`);
    console.error(`   Common causes:`);
    console.error(`   - Dates are in the future or today (YouTube only has data up to yesterday)`);
    console.error(`   - YouTube's date picker validation rejected the input`);
    console.error(`   - Date format mismatch`);
    throw new Error(`Date validation failed. ${!hasStartDate ? 'START' : 'END'} date was not applied. Requested: ${requestedDates}`);
  }

  console.log(`   ✅ Both dates verified in sidebar!`);
  console.log(`   Waiting for table/chart to refresh...`);

  // Wait for data to refresh after date change
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log(`   Data should be refreshed, proceeding to extraction...`);

  // Note: Dialog auto-closes after Apply, no need to manually close
  // ESC key was breaking the UI by closing the advanced metrics tab
}

// Helper: Set Custom Date Range with Auto-Retry on Format Mismatch
// async function setCustomDateRangeWithRetry(startDate, endDate) {
//   // Implementation moved to content-youtube-api.js
// }
async function setCustomDateRangeWithRetry_MIGRATED_TO_API(startDate, endDate) {
  try {
    // First attempt: Use auto-detected format
    await setCustomDateRange(startDate, endDate);
  } catch (error) {
    // Check if this is a YouTube validation error (likely format mismatch)
    if (error.message && error.message.includes('YouTube validation failed')) {
      console.log('⚠️ First attempt failed with YouTube validation error, retrying with alternate date format...');

      // Try to intelligently pick the alternate format by looking at the error message
      // If error says "Enter 05/10/2025", it's expecting a specific format
      let formatToTry = null;
      const errorMatch = error.message.match(/Enter (\d+)\/(\d+)\/(\d+)/);
      if (errorMatch) {
        const firstNum = parseInt(errorMatch[1]);
        const secondNum = parseInt(errorMatch[2]);

        // If first number > 12, it's DD/MM/YYYY; if second > 12, it's MM/DD/YYYY
        if (firstNum > 12) {
          formatToTry = 'DD/MM/YYYY';
          console.log(`   Error suggests DD/MM/YYYY format (first part ${firstNum} > 12)`);
        } else if (secondNum > 12) {
          formatToTry = 'MM/DD/YYYY';
          console.log(`   Error suggests MM/DD/YYYY format (second part ${secondNum} > 12)`);
        } else {
          // Can't determine from error, try MM/DD/YYYY as alternate (DD/MM/YYYY is default)
          console.log(`   Cannot determine format from error, trying MM/DD/YYYY as alternate`);
          formatToTry = 'MM/DD/YYYY';
        }
      } else {
        // No date in error message, try MM/DD/YYYY as alternate (DD/MM/YYYY is default)
        formatToTry = 'MM/DD/YYYY';
        console.log(`   No date in error message, trying MM/DD/YYYY as alternate`);
      }

      try {
        await setCustomDateRange(startDate, endDate, formatToTry);
        console.log(`✅ Retry successful with ${formatToTry} format!`);
      } catch (retryError) {
        // If both attempts failed, throw the original error with additional context
        console.error('❌ Both date format attempts failed!');
        console.error(`   First attempt: auto-detect`);
        console.error(`   Second attempt: ${formatToTry}`);
        throw new Error(`Date format mismatch: Both attempts failed. Original error: ${error.message}. Retry error: ${retryError.message}`);
      }
    } else {
      // Not a validation error, re-throw original error
      throw error;
    }
  }
}

// Helper: Select Metrics
async function selectMetrics_MIGRATED_TO_API() {
  console.log('Selecting metrics...');

  const metricsToSelect = [
    'VIDEO_THUMBNAIL_IMPRESSIONS',
    'EXTERNAL_VIEWS',
    'AVERAGE_WATCH_TIME',
    'AVERAGE_WATCH_PERCENTAGE',
    'VIDEO_THUMBNAIL_IMPRESSIONS_VTR',
    'SHORTS_FEED_IMPRESSIONS_VTR'
  ];

  // Check if metric picker exists - if not, we might be on wrong tab
  let metricPicker = document.querySelector('#metric-picker');
  if (!metricPicker) {
    console.log('Metric picker not found, checking current tab...');

    // Check if we're on Audience Retention or another tab without metric picker
    const reportTriggers = Array.from(document.querySelectorAll('ytcp-dropdown-trigger'));
    let currentTab = 'unknown';

    for (const trigger of reportTriggers) {
      const labelText = trigger.querySelector('.label-text');
      if (labelText && labelText.textContent.trim() === 'Report') {
        const dropdownText = trigger.querySelector('.dropdown-trigger-text');
        if (dropdownText) {
          currentTab = dropdownText.textContent.trim();
        }
        break;
      }
    }

    console.log(`Current tab: "${currentTab}"`);

    // If not on Top content tab, navigate there
    if (!currentTab.toLowerCase().includes('top content')) {
      console.log('Not on Top content tab, navigating there...');
      await navigateBackToMetrics();

      // Try to find metric picker again
      metricPicker = document.querySelector('#metric-picker');
      if (!metricPicker) throw new Error('Metric picker not found even after navigating to Top content');
    } else {
      throw new Error('Metric picker not found on Top content tab');
    }
  }

  const trigger = metricPicker.querySelector('ytcp-dropdown-trigger');
  if (!trigger) throw new Error('Metric trigger not found');

  trigger.click();
  await new Promise(resolve => setTimeout(resolve, 1000));

  const dialog = document.querySelector('tp-yt-paper-dialog[aria-label="Metrics"]');
  if (!dialog) throw new Error('Metrics dialog not found');

  const deselectButton = dialog.querySelector('#deselect-all-button');
  if (deselectButton) {
    deselectButton.click();
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  for (const metricId of metricsToSelect) {
    const checkbox = dialog.querySelector(`ytcp-checkbox-lit#${metricId}`);
    if (!checkbox) continue;

    const checkboxDiv = checkbox.querySelector('[role="checkbox"]');
    if (checkboxDiv && checkboxDiv.getAttribute('aria-checked') === 'false') {
      checkboxDiv.click();
    }
  }

  const applyButton = dialog.querySelector('#apply-button');
  if (!applyButton) throw new Error('Apply button not found');

  applyButton.click();

  // Wait for dialog to close
  await waitForElementRemoval('.metric-dialog-contents', 5000);

  console.log('Metrics selected');
}

// Helper: Extract Values
async function extractValues_MIGRATED_TO_API() {
  console.log('Extracting values...');

  // Wait for table to load AND have data rows
  console.log('Waiting for table with data to load...');
  await waitForElement('yta-explore-table.data-container', 10000);

  // Wait for actual data rows to appear (table might exist but be empty)
  const startTime = Date.now();
  const maxWait = 10000;
  let table, row;

  while (Date.now() - startTime < maxWait) {
    table = document.querySelector('yta-explore-table.data-container');
    if (table) {
      row = table.querySelector('yta-explore-table-row');
      if (row) {
        console.log('Table with data rows found');
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  if (!table) throw new Error('Table not found');
  if (!row) throw new Error('No row found - table may still be loading data');

  const headers = table.querySelectorAll('yta-explore-table-header-cell.metric-column');
  const headerOrder = [];
  headers.forEach(header => {
    const titleEl = header.querySelector('#header-title, .debug-metric-title');
    if (titleEl) {
      headerOrder.push(titleEl.textContent.trim());
    }
  });

  const container = row.querySelector('.layout.horizontal');
  if (!container) throw new Error('Row container not found');

  const metricColumns = Array.from(container.children).filter(child =>
    child.className.includes('metric-column') &&
    child.textContent.trim() !== ''
  );

  const metrics = {
    impressions: null,
    views: null,
    awt: null,
    consumption: null,
    ctr: null,
    stayedToWatch: null
  };

  metricColumns.forEach((cell, index) => {
    const value = cell.textContent.trim();
    const headerText = headerOrder[index];

    if (!headerText) return;

    const headerLower = headerText.toLowerCase();

    if (headerLower.includes('impressions') && !headerLower.includes('rate')) {
      metrics.impressions = value;
    } else if (headerLower === 'views') {
      metrics.views = value;
    } else if (headerLower.includes('average view duration') || headerLower.includes('average watch time')) {
      metrics.awt = value;
    } else if (headerLower.includes('average percentage')) {
      metrics.consumption = value;
    } else if (headerLower.includes('click-through rate')) {
      metrics.ctr = value;
    } else if (headerLower.includes('stayed to watch')) {
      metrics.stayedToWatch = value;
    }
  });

  console.log('Values extracted');
  return metrics;
}

// Helper: Check if on Analytics tab
// function isOnAnalyticsTab() {
//   // Implementation moved to content-youtube-api.js
// }

// // Helper: Check if on Advanced Mode (explore page)
// function isOnAdvancedMode() {
//   // Implementation moved to content-youtube-api.js
// }

// Helper: Close Advanced Mode and return to regular Analytics
// async function closeAdvancedMode() {
//   // Implementation moved to content-youtube-api.js
// }

// Helper: Navigate to Analytics tab (if not already there)
// async function navigateToAnalyticsTab() {
//   // Implementation moved to content-youtube-api.js
// }

// Helper: Navigate to Advanced Mode
// async function navigateToAdvancedMode() {
//   // Implementation moved to content-youtube-api.js
// }

// Helper: Navigate to Audience Retention report
// async function navigateToAudienceRetention() {
//   // Implementation moved to content-youtube-api.js
// }

// Helper: Navigate back to metrics table report
// async function navigateBackToMetrics() {
//   // Implementation moved to content-youtube-api.js
// }

// Helper: Extract Retention Metric (30s/3s)
async function extractRetentionMetric_MIGRATED_TO_API() {
  console.log('Extracting retention metric...');

  // Find the audience retention chart
  const chartContainers = Array.from(document.querySelectorAll('yta-line-chart-base'));
  let svg = null;

  for (const container of chartContainers) {
    const parent = container.closest('yta-explore-chart-with-player');
    if (parent) {
      svg = container.querySelector('svg');
      if (svg) break;
    }
  }

  if (!svg) {
    svg = document.querySelector('yta-line-chart-base svg');
  }

  if (!svg) {
    throw new Error('Retention chart not found');
  }

  // Extract path data
  const pathElement = svg.querySelector('path.line-series');
  if (!pathElement) {
    throw new Error('Retention path not found');
  }

  const pathData = pathElement.getAttribute('d');
  const points = [];
  const commands = pathData.replace('M', 'L').split('L').filter(cmd => cmd.trim());

  commands.forEach(cmd => {
    const [x, y] = cmd.split(',').map(Number);
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  });

  // Extract Y-axis scale (retention percentage)
  const yAxisTicks = Array.from(svg.querySelectorAll('.y2.axis .tick text tspan'));
  const yAxisValues = yAxisTicks.map(tick => {
    const text = tick.textContent.trim();
    return parseFloat(text.replace('%', ''));
  }).filter(val => !isNaN(val));

  const maxY = Math.max(...yAxisValues);
  const minY = Math.min(...yAxisValues);

  const yAxisTickElements = Array.from(svg.querySelectorAll('.y2.axis .tick'));
  const yPixels = yAxisTickElements.map(tick => {
    const transform = tick.getAttribute('transform');
    const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
    return match ? parseFloat(match[2]) : null;
  }).filter(val => val !== null);

  const minYPixel = Math.min(...yPixels);
  const maxYPixel = Math.max(...yPixels);
  const chartHeight = maxYPixel - minYPixel;

  // Validate Y-axis
  if (maxY > 150) {
    throw new Error(`Invalid retention chart (Y-axis: ${maxY}%)`);
  }

  // Extract X-axis scale (time)
  const xAxisTicks = Array.from(svg.querySelectorAll('.x.axis .tick text tspan'));
  const xAxisValues = xAxisTicks.map(tick => {
    const text = tick.textContent.trim();
    const parts = text.split(':').map(Number);
    return parts[0] * 60 + (parts[1] || 0);
  }).filter(val => !isNaN(val));

  const minTime = Math.min(...xAxisValues);
  const maxTime = Math.max(...xAxisValues);

  const xAxisTickElements = Array.from(svg.querySelectorAll('.x.axis .tick'));
  const xPixels = xAxisTickElements.map(tick => {
    const transform = tick.getAttribute('transform');
    const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
    return match ? parseFloat(match[1]) : null;
  }).filter(val => val !== null);

  const minXPixel = Math.min(...xPixels);
  const maxXPixel = Math.max(...xPixels);
  const chartWidth = maxXPixel - minXPixel;

  // Validate X-axis
  if (maxTime > 7200 || maxTime < 1) {
    throw new Error(`Invalid video duration (${maxTime}s)`);
  }

  // Conversion functions
  const pixelToTime = (x) => {
    return minTime + (x - minXPixel) * (maxTime - minTime) / chartWidth;
  };

  const pixelToRetention = (y) => {
    const percentageRange = maxY - minY;
    return maxY - ((y - minYPixel) * percentageRange / chartHeight);
  };

  // Get retention at specific time
  function getRetentionAtTime(targetSeconds) {
    const targetX = minXPixel + (targetSeconds - minTime) * chartWidth / (maxTime - minTime);

    let closest = points[0];
    let minDistance = Math.abs(points[0].x - targetX);

    for (const point of points) {
      const distance = Math.abs(point.x - targetX);
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }

    const retention = pixelToRetention(closest.y);
    return Math.round(retention * 10) / 10;
  }

  // Determine video type and get metric
  const isShort = maxTime < 60;
  const targetTime = isShort ? 3 : 30;

  let retentionValue = null;
  if (targetTime <= maxTime) {
    retentionValue = getRetentionAtTime(targetTime);
  }

  console.log(`Retention extracted: ${retentionValue}% at ${targetTime}s`);

  return {
    value: retentionValue ? `${retentionValue}%` : 'N/A',
    targetTime: targetTime,
    isShort: isShort,
    videoDuration: maxTime
  };
}

// Main: Extract PRE/POST Metrics
async function extractPrePostMetrics_MIGRATED_TO_API(preStart, preEnd, postStart, postEnd, statusCallback, includeRetention = false) {
  try {
    if (statusCallback) statusCallback('🔧 Opening metrics picker...');
    await new Promise(resolve => setTimeout(resolve, 50));

    if (statusCallback) statusCallback('🔧 Selecting required metrics...');
    await selectMetrics();

    if (statusCallback) statusCallback('📅 Opening date picker for PRE...');
    await new Promise(resolve => setTimeout(resolve, 50));

    if (statusCallback) statusCallback('📅 Setting PRE period dates...');
    await setCustomDateRangeWithRetry(preStart, preEnd);

    if (statusCallback) statusCallback('⏳ Waiting for PRE data to load...');
    await new Promise(resolve => setTimeout(resolve, 100));

    if (statusCallback) statusCallback('📥 Reading PRE metrics from table...');
    const preMetrics = await extractValues();

    if (statusCallback) statusCallback('📅 Opening date picker for POST...');
    await new Promise(resolve => setTimeout(resolve, 50));

    if (statusCallback) statusCallback('📅 Setting POST period dates...');
    await setCustomDateRangeWithRetry(postStart, postEnd);

    if (statusCallback) statusCallback('⏳ Waiting for POST data to load...');
    await new Promise(resolve => setTimeout(resolve, 100));

    if (statusCallback) statusCallback('📥 Reading POST metrics from table...');
    const postMetrics = await extractValues();

    // Extract retention if enabled
    let preRetention = null;
    let postRetention = null;

    if (includeRetention) {
      try {
        if (statusCallback) statusCallback('📊 Opening report menu...');
        await new Promise(resolve => setTimeout(resolve, 50));

        if (statusCallback) statusCallback('📊 Switching to Audience Retention...');
        await navigateToAudienceRetention();

        if (statusCallback) statusCallback('⏳ Waiting for retention chart...');
        await new Promise(resolve => setTimeout(resolve, 100));

        if (statusCallback) statusCallback('📅 Setting PRE dates for retention...');
        await setCustomDateRangeWithRetry(preStart, preEnd);

        if (statusCallback) statusCallback('📊 Reading PRE retention value...');
        preRetention = await extractRetentionMetric();

        if (statusCallback) statusCallback('📅 Setting POST dates for retention...');
        await setCustomDateRangeWithRetry(postStart, postEnd);

        if (statusCallback) statusCallback('📊 Reading POST retention value...');
        postRetention = await extractRetentionMetric();

        // All data has been extracted successfully!
        // Note: We could navigate back to the metrics table here for UX,
        // but it's not necessary and can fail if the page structure has changed.
        // Keeping the user on the Audience Retention page is fine.
        if (statusCallback) statusCallback('✅ All data extracted!');

        // Uncomment below if you want to try navigating back (optional, for UX only)
        /*
        try {
          await navigateBackToMetrics();
        } catch (navError) {
          console.log('Staying on Audience Retention page (all data already extracted)');
        }
        */

      } catch (error) {
        console.warn('Retention extraction failed:', error);
        // Continue without retention data
        preRetention = { value: 'N/A', error: error.message };
        postRetention = { value: 'N/A', error: error.message };
      }
    }

    if (statusCallback) statusCallback('✅ Extraction complete!');

    return {
      pre: {
        ...preMetrics,
        retention: preRetention
      },
      post: {
        ...postMetrics,
        retention: postRetention
      },
      periods: {
        pre: { start: preStart, end: preEnd },
        post: { start: postStart, end: postEnd }
      }
    };

  } catch (error) {
    console.error('Extraction error:', error);
    throw error;
  }
}

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
function init() {
  return YTTreatmentHelper.SingleVideo.init();
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
