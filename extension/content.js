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

// Helper: Get video publish date from page
function getVideoPublishDate() {
  // Try multiple methods to find the publish date

  // Method 1 (BEST): Extract from Analytics page date selector
  // When on Analytics tab, the default "Since published" shows the exact publish date
  // Look for: <div class="label-text">21 Oct 2025 – Now</div>
  //           <span class="dropdown-trigger-text">Since published</span>

  const dateSelectors = document.querySelectorAll('ytcp-dropdown-trigger');
  for (const selector of dateSelectors) {
    const triggerText = selector.querySelector('.dropdown-trigger-text');
    const labelText = selector.querySelector('.label-text');

    if (triggerText && labelText) {
      const triggerContent = triggerText.textContent.trim();
      const labelContent = labelText.textContent.trim();

      // Check if this is the "Since published" selector
      if (triggerContent.toLowerCase().includes('since published') ||
          triggerContent.toLowerCase().includes('published')) {

        // Extract start date from label like "21 Oct 2025 – Now"
        // Match patterns: "21 Oct 2025", "21 October 2025", etc.
        const dateMatch = labelContent.match(/(\d{1,2}\s+\w{3,9}\s+\d{4})/);
        if (dateMatch) {
          const publishDate = new Date(dateMatch[1]);
          if (!isNaN(publishDate.getTime())) {
            console.log(`✅ Found publish date from Analytics date selector: ${formatDate(publishDate)}`);
            return publishDate;
          }
        }
      }
    }
  }

  // Method 2: Check yta-time-picker (another common location on Analytics page)
  const timePicker = document.querySelector('yta-time-picker ytcp-dropdown-trigger');
  if (timePicker) {
    const labelText = timePicker.querySelector('.label-text');
    const triggerText = timePicker.querySelector('.dropdown-trigger-text');

    if (labelText && triggerText && triggerText.textContent.toLowerCase().includes('published')) {
      const dateMatch = labelText.textContent.match(/(\d{1,2}\s+\w{3,9}\s+\d{4})/);
      if (dateMatch) {
        const publishDate = new Date(dateMatch[1]);
        if (!isNaN(publishDate.getTime())) {
          console.log(`✅ Found publish date from time picker: ${formatDate(publishDate)}`);
          return publishDate;
        }
      }
    }
  }

  // Method 3: Check URL for video ID and use ytInitialData
  if (window.ytInitialData) {
    try {
      const videoDetails = window.ytInitialData?.videoDetails;
      if (videoDetails?.publishDate) {
        const publishDate = new Date(videoDetails.publishDate);
        console.log(`✅ Found publish date from ytInitialData: ${formatDate(publishDate)}`);
        return publishDate;
      }
    } catch (e) {
      console.log('Could not extract publish date from ytInitialData');
    }
  }

  // Method 4: Look for publish date in the Details tab metadata
  const metaElements = document.querySelectorAll('ytcp-video-metadata-editor-sidepanel [class*="metadata"], [class*="published"]');
  for (const el of metaElements) {
    const text = el.textContent;
    const dateMatch = text.match(/(?:Published|Uploaded).*?(\w{3}\s+\d{1,2},?\s+\d{4})/i);
    if (dateMatch) {
      const publishDate = new Date(dateMatch[1]);
      if (!isNaN(publishDate.getTime())) {
        console.log(`✅ Found publish date from metadata: ${formatDate(publishDate)}`);
        return publishDate;
      }
    }
  }

  console.warn('⚠️ Could not detect video publish date from any source');
  return null;
}

// Core Logic: Calculate PRE and POST date ranges
function calculateDateRanges(treatmentDate, videoPublishDate = null) {
  const treatment = new Date(treatmentDate);
  const today = new Date();

  // YouTube Analytics only has data up to 2 days ago (not today or yesterday)
  // This accounts for:
  // 1. Timezone differences (you might be ahead of YouTube's servers)
  // 2. YouTube's data processing delay
  // We use 2 days ago to be safe and avoid validation errors
  const maxYouTubeDate = new Date(today);
  maxYouTubeDate.setDate(maxYouTubeDate.getDate() - 2);
  const yesterday = maxYouTubeDate; // Rename for backward compatibility

  // Set to start of day to avoid timezone issues
  yesterday.setHours(0, 0, 0, 0);
  treatment.setHours(0, 0, 0, 0);

  // Calculate days since treatment (up to yesterday)
  const daysSince = Math.floor((yesterday - treatment) / (1000 * 60 * 60 * 24));

  // Validate that treatment date is not in the future
  if (daysSince < 0) {
    throw new Error('Treatment date cannot be in the future. Please select a date at least 1 day ago.');
  }

  // Validate that treatment date is not too recent (need at least 2 full days of data)
  if (daysSince < 2) {
    throw new Error('Treatment date must be at least 3 days ago to have enough data for analysis. YouTube data has a 2-day delay.');
  }

  // Calculate available POST days: from treatment to yesterday
  const maxPostDays = daysSince + 1; // Including treatment day

  // Calculate available PRE days: from publish date to day before treatment
  let maxPreDays;
  let publishDate;

  if (videoPublishDate) {
    publishDate = new Date(videoPublishDate);
    publishDate.setHours(0, 0, 0, 0);

    // Calculate days between publish and treatment
    const daysBetween = Math.floor((treatment - publishDate) / (1000 * 60 * 60 * 24));
    maxPreDays = daysBetween; // Days available for PRE period

    console.log(`   Available PRE days: ${maxPreDays} (from ${formatDate(publishDate)} to day before treatment)`);
    console.log(`   Available POST days: ${maxPostDays} (from treatment to ${formatDate(yesterday)})`);
  } else {
    // If no publish date, assume PRE can be as long as POST
    maxPreDays = maxPostDays;
    console.warn(`   No publish date - assuming equal periods are available`);
  }

  // Use the SHORTER of the two periods for fair comparison
  const periodLength = Math.min(maxPreDays, maxPostDays);

  console.log(`   Using period length: ${periodLength} days (shorter of PRE: ${maxPreDays}, POST: ${maxPostDays})`);

  // PRE period: {periodLength} days ending the day before treatment
  const preEnd = new Date(treatment);
  preEnd.setDate(preEnd.getDate() - 1); // Day before treatment
  const preStart = new Date(preEnd);
  preStart.setDate(preStart.getDate() - periodLength + 1); // Go back {periodLength} days
  const preDays = periodLength;

  // POST period: {periodLength} days starting from treatment
  const postStart = new Date(treatment);
  const postEnd = new Date(postStart);
  postEnd.setDate(postEnd.getDate() + periodLength - 1); // Forward {periodLength} days
  const postDays = periodLength;

  // Validate: Ensure periods don't exceed available data
  if (videoPublishDate && preStart < publishDate) {
    console.error(`❌ Error: Calculated PRE start ${formatDate(preStart)} is before publish ${formatDate(publishDate)}`);
    throw new Error('Internal error: PRE period calculation error. Please report this bug.');
  }

  if (postEnd > yesterday) {
    console.error(`❌ Error: Calculated POST end ${formatDate(postEnd)} is after yesterday ${formatDate(yesterday)}`);
    throw new Error('Internal error: POST period calculation error. Please report this bug.');
  }

  console.log(`Date calculation:
    Today: ${formatDate(today)}
    Yesterday (YouTube max): ${formatDate(yesterday)}
    Treatment: ${formatDate(treatment)}
    Video published: ${videoPublishDate ? formatDate(videoPublishDate) : 'Unknown'}
    Days since: ${daysSince}
    POST: ${formatDate(postStart)} to ${formatDate(postEnd)} (${postDays} days)
    PRE: ${formatDate(preStart)} to ${formatDate(preEnd)} (${preDays} days)
  `);

  return {
    daysSince: daysSince,
    videoPublishDate: videoPublishDate ? formatDate(videoPublishDate) : null,
    pre: {
      start: formatDate(preStart),
      end: formatDate(preEnd),
      days: preDays
    },
    post: {
      start: formatDate(postStart),
      end: formatDate(postEnd),
      days: postDays
    }
  };
}

// ============================================================
// PHASE 2: AUTOMATIC METRICS EXTRACTION
// ============================================================

// Helper: Set Custom Date Range
async function setCustomDateRange(startDate, endDate, overrideFormat = null) {
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
async function setCustomDateRangeWithRetry(startDate, endDate) {
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
async function selectMetrics() {
  console.log('Selecting metrics...');

  const metricsToSelect = [
    'VIDEO_THUMBNAIL_IMPRESSIONS',
    'EXTERNAL_VIEWS',
    'AVERAGE_WATCH_TIME',
    'AVERAGE_WATCH_PERCENTAGE',
    'VIDEO_THUMBNAIL_IMPRESSIONS_VTR'
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
async function extractValues() {
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
    ctr: null
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
    }
  });

  console.log('Values extracted');
  return metrics;
}

// Helper: Check if on Analytics tab
function isOnAnalyticsTab() {
  // Check URL pattern - Analytics tab URLs contain /analytics/
  const urlPattern = /\/video\/[^\/]+\/analytics\//;
  return urlPattern.test(window.location.href);
}

// Helper: Check if on Advanced Mode (explore page)
function isOnAdvancedMode() {
  return window.location.href.includes('/explore?');
}

// Helper: Close Advanced Mode and return to regular Analytics
async function closeAdvancedMode() {
  console.log('Closing Advanced Mode...');

  // Log action
  if (window.ExtensionLogger) {
    window.ExtensionLogger.logInfo('Closing Advanced Mode to fetch publish date');
  }

  // Find the close button in Advanced Mode
  const closeButton = document.querySelector('yta-explore-page #close-button');

  if (!closeButton) {
    console.warn('Close button not found in Advanced Mode');
    if (window.ExtensionLogger) {
      window.ExtensionLogger.logWarning('Close button not found in Advanced Mode');
    }
    return false;
  }

  // Click the close button
  closeButton.click();

  // Wait for navigation back to regular Analytics
  try {
    await waitForUrlChange('/analytics/tab-', 5000);
  } catch (error) {
    console.error('Timeout waiting for Advanced Mode to close');
    if (window.ExtensionLogger) {
      window.ExtensionLogger.logError('Timeout closing Advanced Mode', error);
    }
    return false;
  }

  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('Closed Advanced Mode, back to regular Analytics');
  if (window.ExtensionLogger) {
    window.ExtensionLogger.logInfo('Successfully closed Advanced Mode');
  }
  return true;
}

// Helper: Navigate to Analytics tab (if not already there)
async function navigateToAnalyticsTab() {
  console.log('Checking if on Analytics tab...');

  // If on Advanced Mode, close it first to go back to regular Analytics
  if (isOnAdvancedMode()) {
    console.log('Currently on Advanced Mode, closing it first...');
    const closed = await closeAdvancedMode();
    if (closed) {
      console.log('Advanced Mode closed, now on regular Analytics');
      return;
    }
    // If close failed, continue with normal navigation
  }

  // Check if already on Analytics tab (but not Advanced Mode)
  if (isOnAnalyticsTab()) {
    console.log('Already on Analytics tab');
    return;
  }

  console.log('Not on Analytics tab, navigating there...');

  // Find the Analytics navigation link in the left sidebar
  // Based on analytics-navigation-panel.html, the Analytics link has:
  // - class="menu-item-link"
  // - contains "Analytics" text
  // - href pattern: /video/{videoId}/analytics/tab-overview/period-default

  const navLinks = Array.from(document.querySelectorAll('a.menu-item-link'));
  let analyticsLink = null;

  for (const link of navLinks) {
    const linkText = link.textContent.toLowerCase();
    const href = link.getAttribute('href') || '';

    // Check if this is the Analytics link
    if (linkText.includes('analytics') && href.includes('/analytics/')) {
      analyticsLink = link;
      console.log(`Found Analytics link with href: ${href}`);
      break;
    }
  }

  if (!analyticsLink) {
    // Try alternative selector - the tp-yt-paper-icon-item with class "analytics"
    const analyticsItem = document.querySelector('tp-yt-paper-icon-item.analytics');
    if (analyticsItem) {
      const parentLink = analyticsItem.closest('a.menu-item-link');
      if (parentLink) {
        analyticsLink = parentLink;
        console.log('Found Analytics link via icon item');
      }
    }
  }

  if (!analyticsLink) {
    throw new Error('Analytics navigation link not found. Please navigate to a video page first.');
  }

  // Click the Analytics link
  analyticsLink.click();

  // Wait for URL to change to Analytics tab
  await waitForUrlChange('/analytics/', 10000);

  // Wait for the page to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('Navigated to Analytics tab');
}

// Helper: Navigate to Advanced Mode
async function navigateToAdvancedMode() {
  console.log('Navigating to Advanced Mode...');

  // First, ensure we're on the Analytics tab
  await navigateToAnalyticsTab();

  // Find the Advanced mode button
  const advancedButton = document.querySelector('#advanced-analytics button');

  if (!advancedButton) {
    throw new Error('Advanced mode button not found. Please navigate to a video analytics page first.');
  }

  advancedButton.click();

  // Wait for URL to change to Advanced mode
  await waitForUrlChange('/explore?', 10000);

  // Wait for the metrics table to appear (confirms page is loaded)
  await waitForElement('yta-explore-table.data-container', 10000);

  // Give additional time for all interactive elements to load
  // This helps prevent "Custom option not found" errors
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Ensure progress bar state persists after navigation
  const progressContainer = document.getElementById('progress-container');
  if (progressContainer && progressContainer.dataset.currentStep) {
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    const savedPercentage = progressContainer.dataset.currentPercentage;
    if (progressFill && progressPercent) {
      progressFill.style.width = `${savedPercentage}%`;
      progressPercent.textContent = `${savedPercentage}%`;
    }
  }

  console.log('Navigated to Advanced Mode');
}

// Helper: Navigate to Audience Retention report
async function navigateToAudienceRetention() {
  console.log('Navigating to Audience Retention...');

  // Find and click Report dropdown
  const reportTriggers = Array.from(document.querySelectorAll('ytcp-dropdown-trigger'));
  let reportDropdown = null;

  for (const trigger of reportTriggers) {
    const labelText = trigger.querySelector('.label-text');
    if (labelText && labelText.textContent.trim() === 'Report') {
      reportDropdown = trigger;
      break;
    }
  }

  if (!reportDropdown) {
    throw new Error('Report dropdown not found');
  }

  reportDropdown.click();

  // Wait for dropdown menu with Audience retention option to appear
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for Audience retention option')), 5000);
    const checkInterval = setInterval(() => {
      const items = document.querySelectorAll('tp-yt-paper-item');
      for (const item of items) {
        if (item.textContent.toLowerCase().includes('audience retention')) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve();
          return;
        }
      }
    }, 100);
  });

  // Find and click Audience retention option (case-insensitive)
  const menuItems = Array.from(document.querySelectorAll('tp-yt-paper-item'));
  console.log(`Found ${menuItems.length} menu items`);

  let retentionOption = null;

  for (const item of menuItems) {
    const text = item.textContent.toLowerCase();
    console.log(`Checking menu item: "${text.substring(0, 50)}..."`);
    if (text.includes('audience retention')) {
      retentionOption = item;
      console.log('Found Audience retention option!');
      break;
    }
  }

  if (!retentionOption) {
    console.error('Available menu items:', menuItems.map(i => i.textContent.substring(0, 50)));
    throw new Error('Audience retention option not found');
  }

  retentionOption.click();

  // Wait for tab switch to complete
  console.log('Waiting for tab to switch...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Ensure progress bar state persists after navigation
  const progressContainer = document.getElementById('progress-container');
  if (progressContainer && progressContainer.dataset.currentStep) {
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    const savedPercentage = progressContainer.dataset.currentPercentage;
    if (progressFill && progressPercent) {
      progressFill.style.width = `${savedPercentage}%`;
      progressPercent.textContent = `${savedPercentage}%`;
    }
  }

  // Wait for retention chart to load
  await waitForElement('yta-line-chart-base svg', 10000);

  console.log('Navigated to Audience Retention');
}

// Helper: Navigate back to metrics table report
async function navigateBackToMetrics() {
  console.log('Navigating back to metrics table...');

  // First, close any open dialogs/dropdowns from previous operations
  const openDialogs = document.querySelectorAll('tp-yt-paper-dialog[role="dialog"]');
  for (const dialog of openDialogs) {
    if (dialog.offsetParent !== null) {
      // Dialog is visible, try to close it
      const closeBtn = dialog.querySelector('button[aria-label*="lose"], button[aria-label*="ancel"]');
      if (closeBtn) {
        closeBtn.click();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      // Also try clicking backdrop to close
      const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
      if (backdrop && backdrop.offsetParent !== null) {
        backdrop.click();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  // Find and click Report dropdown
  const reportTriggers = Array.from(document.querySelectorAll('ytcp-dropdown-trigger'));
  console.log(`Found ${reportTriggers.length} dropdown triggers`);

  let reportDropdown = null;

  for (const trigger of reportTriggers) {
    const labelText = trigger.querySelector('.label-text');
    const text = labelText ? labelText.textContent.trim() : '';
    if (text === 'Report') {
      reportDropdown = trigger;
      console.log('Found Report dropdown trigger');
      break;
    }
  }

  if (!reportDropdown) {
    const availableLabels = reportTriggers
      .map(t => t.querySelector('.label-text')?.textContent.trim())
      .filter(Boolean)
      .slice(0, 5);
    console.error('Report dropdown not found. Available labels:', availableLabels);
    throw new Error('Report dropdown not found');
  }

  // Check if dropdown is already open, close it first
  const existingMenu = reportDropdown.querySelector('tp-yt-paper-listbox[role="menu"]');
  if (existingMenu && existingMenu.offsetParent !== null) {
    console.log('Report dropdown already open, closing first...');
    reportDropdown.click();
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Now open the dropdown
  reportDropdown.click();
  console.log('Clicked Report dropdown, waiting for menu...');

  // Wait for dropdown menu to appear
  await new Promise(resolve => setTimeout(resolve, 800));

  // Find the menu - it might be inside the dropdown trigger itself or nearby
  let reportMenu = null;

  // Strategy 1: Look for the menu inside the dropdown trigger
  reportMenu = reportDropdown.querySelector('tp-yt-paper-listbox[role="menu"]');
  if (reportMenu && reportMenu.offsetParent !== null) {
    console.log('Found report menu inside dropdown trigger');
  } else {
    reportMenu = null;
  }

  // Strategy 2: Look for any visible listbox with role="menu" (globally)
  if (!reportMenu) {
    const allListboxes = document.querySelectorAll('tp-yt-paper-listbox[role="menu"]');
    console.log(`Found ${allListboxes.length} listboxes with role="menu"`);

    for (const listbox of allListboxes) {
      if (listbox.offsetParent !== null) {
        // Check if this is the Report menu by looking for "Popular" or "Top content"
        const items = listbox.querySelectorAll('tp-yt-paper-item');
        for (const item of items) {
          if (item.textContent.includes('Top content') || item.textContent.includes('Popular')) {
            reportMenu = listbox;
            console.log('Found visible report menu (contains Top content/Popular)');
            break;
          }
        }
        if (reportMenu) break;
      }
    }
  }

  // Strategy 3: Look inside dialogs (fallback)
  if (!reportMenu) {
    const dialogs = document.querySelectorAll('tp-yt-paper-dialog[role="dialog"]');
    for (const dialog of dialogs) {
      if (dialog.offsetParent !== null) {
        const listbox = dialog.querySelector('tp-yt-paper-listbox[role="menu"]');
        if (listbox) {
          reportMenu = listbox;
          console.log('Found report menu inside dialog');
          break;
        }
      }
    }
  }

  if (!reportMenu) {
    console.error('Report menu not found after trying all strategies');

    // Debug: Show what we can find
    const allListboxes = document.querySelectorAll('tp-yt-paper-listbox');
    console.log('All listboxes on page:', allListboxes.length);
    const visibleListboxes = Array.from(allListboxes).filter(l => l.offsetParent !== null);
    console.log('Visible listboxes:', visibleListboxes.length);
    visibleListboxes.forEach((lb, i) => {
      console.log(`  Listbox ${i}: role=${lb.getAttribute('role')}, parent=${lb.parentElement?.tagName}`);
    });

    throw new Error('Report menu not found after trying all strategies');
  }

  // Find and click "Top content in the past 28 days" option (default metrics view)
  // Search ONLY within the report menu, not all items on the page
  const menuItems = Array.from(reportMenu.querySelectorAll('tp-yt-paper-item'));
  console.log(`Found ${menuItems.length} items in report menu`);

  let topContentOption = null;

  for (const item of menuItems) {
    const text = item.textContent.trim();
    // Match "Top content in the past 28 days" (with or without nbsp)
    if (text.includes('Top content') && text.includes('past 28') && text.includes('days')) {
      topContentOption = item;
      console.log('Found "Top content in the past 28 days" option');
      break;
    }
  }

  if (!topContentOption) {
    console.error('Top content option not found. Available options:',
      menuItems.slice(0, 10).map(i => i.textContent.trim().substring(0, 50)));
    throw new Error('Top content in the past 28 days option not found');
  }

  topContentOption.click();

  // Wait for tab switch to complete
  console.log('Waiting for tab to switch...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Wait for metrics table to load
  await waitForElement('yta-explore-table.data-container', 10000);

  // Ensure progress bar state persists after navigation
  const progressContainer = document.getElementById('progress-container');
  if (progressContainer && progressContainer.dataset.currentStep) {
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    const savedPercentage = progressContainer.dataset.currentPercentage;
    if (progressFill && progressPercent) {
      progressFill.style.width = `${savedPercentage}%`;
      progressPercent.textContent = `${savedPercentage}%`;
    }
  }

  console.log('Navigated back to metrics table');
}

// Helper: Extract Retention Metric (30s/3s)
async function extractRetentionMetric() {
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
async function extractPrePostMetrics(preStart, preEnd, postStart, postEnd, statusCallback, includeRetention = false) {
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

// Make panel draggable by header
function makePanelDraggable(panel) {
  const header = panel.querySelector('.helper-header');
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;

  // Add cursor style to indicate draggability
  header.style.cursor = 'move';

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    // Don't drag if clicking on close button or other interactive elements
    if (e.target.classList.contains('helper-close-btn') ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Only drag if clicking on header or drag handle
    if (!header.contains(e.target)) {
      return;
    }

    // Get current position
    const rect = panel.getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;

    isDragging = true;
    header.style.cursor = 'grabbing';
    e.preventDefault(); // Prevent text selection while dragging
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      // Keep panel within viewport
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY));

      panel.style.left = currentX + 'px';
      panel.style.top = currentY + 'px';
      panel.style.right = 'auto';
    }
  }

  function dragEnd() {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'move';

      // Save position to storage
      safeStorage.set({
        panelPosition: {
          left: panel.style.left,
          top: panel.style.top
        }
      });
    }
  }

  // Restore saved position
  safeStorage.get(['panelPosition']).then((result) => {
    if (result.panelPosition) {
      panel.style.left = result.panelPosition.left;
      panel.style.top = result.panelPosition.top;
      panel.style.right = 'auto';
    }
  });
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
function createHelperPanel() {
  // Check if panel already exists
  if (document.getElementById('yt-treatment-helper')) {
    return;
  }

  // Log panel creation
  if (window.ExtensionLogger) {
    window.ExtensionLogger.logInfo('Helper panel created');
  }

  const panel = document.createElement('div');
  panel.id = 'yt-treatment-helper';
  panel.innerHTML = `
    <div class="helper-header">
      <div class="header-content">
        <span class="drag-handle">⋮⋮</span>
        <h3>Treatment Comparison</h3>
      </div>
      <button id="helper-close" class="helper-close-btn">×</button>
    </div>
    <div class="helper-body">

      <!-- Step 1: Treatment Date -->
      <div class="step-container" id="step-1">
        <div class="step-label">Select treatment date (DD/MM/YYYY)</div>
        <div class="input-section">
          <input type="text" id="treatment-date" class="date-input" placeholder="DD/MM/YYYY" maxlength="10" />
          <button id="calculate-btn" class="action-btn calculate-btn">Calculate</button>
        </div>
      </div>

      <!-- Step 2: Date Ranges -->
      <div id="results-section" class="results-section" style="display: none;">

        <div class="step-container">
          <div class="step-label-with-action">
            <span class="step-label">Calculated periods</span>
            <button id="edit-dates-btn" class="edit-link">Edit</button>
          </div>
        </div>

        <div class="periods-container">
          <div class="period-block pre-period">
            <div class="period-header">
              <span class="period-label">PRE</span>
              <span class="period-duration"><span id="pre-days">0</span>d</span>
            </div>
            <div class="period-dates-vertical">
              <div class="date-row">
                <label class="date-label">Start</label>
                <input type="text" id="pre-start" class="date-edit" placeholder="DD/MM/YYYY" maxlength="10" disabled />
              </div>
              <div class="date-row">
                <label class="date-label">End</label>
                <input type="text" id="pre-end" class="date-edit" placeholder="DD/MM/YYYY" maxlength="10" disabled />
              </div>
            </div>
          </div>

          <div class="period-block post-period">
            <div class="period-header">
              <span class="period-label">POST</span>
              <span class="period-duration"><span id="post-days">0</span>d</span>
            </div>
            <div class="period-dates-vertical">
              <div class="date-row">
                <label class="date-label">Start</label>
                <input type="text" id="post-start" class="date-edit" placeholder="DD/MM/YYYY" maxlength="10" disabled />
              </div>
              <div class="date-row">
                <label class="date-label">End</label>
                <input type="text" id="post-end" class="date-edit" placeholder="DD/MM/YYYY" maxlength="10" disabled />
              </div>
            </div>
          </div>
        </div>

        <!-- Info for period limitations -->
        <div id="period-warning" class="period-warning" style="display: none;">
          ℹ️ Period length adjusted for fair comparison.
        </div>

        <!-- Error for invalid treatment date -->
        <div id="treatment-error" class="treatment-error" style="display: none;">
          ❌ Treatment date cannot be before the video was published!
        </div>

        <!-- Step 3: Extraction Mode Selection -->
        <div class="step-container" id="extraction-mode-section" style="display: none;">
          <div class="step-label">Choose extraction type</div>
          <div class="extraction-mode-options">
            <label class="radio-option">
              <input type="radio" name="extraction-mode" value="complete" checked>
              <div class="radio-content">
                <div class="radio-title">Complete Analysis</div>
                <div class="radio-description">Both equal periods and lifetime in one extraction</div>
              </div>
            </label>
            <label class="radio-option">
              <input type="radio" name="extraction-mode" value="equal-periods">
              <div class="radio-content">
                <div class="radio-title">Equal Periods</div>
                <div class="radio-description">For treatment comparison (spreadsheet)</div>
              </div>
            </label>
            <label class="radio-option">
              <input type="radio" name="extraction-mode" value="lifetime">
              <div class="radio-content">
                <div class="radio-title">Lifetime</div>
                <div class="radio-description">For Airtable (publish to treatment, publish to today)</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Step 4: Extract -->
        <div class="extract-controls">
          <button id="auto-extract-btn" class="action-btn extract-btn">
            <span class="btn-icon">📊</span> Extract Metrics
          </button>
          <button id="cancel-extract-btn" class="cancel-btn" style="display: none;">Cancel</button>
        </div>

        <!-- Progress Bar -->
        <div id="progress-container" class="progress-container" style="display: none;">
          <div class="progress-wrapper">
            <div class="progress-bar">
              <div id="progress-fill" class="progress-fill"></div>
            </div>
            <div id="progress-percent" class="progress-percent">0%</div>
          </div>
        </div>

        <div id="extraction-status" class="extraction-status" style="display: none;"></div>

        <!-- Step 4: Results -->
        <div id="metrics-results" class="metrics-results" style="display: none;">
          <div class="metrics-grid">
            <div class="metrics-column pre-column">
              <div class="column-header">PRE</div>
              <div class="metric-row">
                <span class="metric-label">Impressions</span>
                <span id="pre-impressions" class="metric-value">—</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">CTR</span>
                <span id="pre-ctr" class="metric-value">—</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Views</span>
                <span id="pre-views" class="metric-value">—</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">AWT</span>
                <span id="pre-awt" class="metric-value">—</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Retention</span>
                <span id="pre-retention" class="metric-value">—</span>
              </div>
              <button id="copy-pre-btn" class="copy-btn" data-period="pre"><span class="btn-icon">📋</span> Copy Pre</button>
            </div>

            <div class="metrics-column post-column">
              <div class="column-header">POST</div>
              <div class="metric-row">
                <span class="metric-label">Impressions</span>
                <span id="post-impressions" class="metric-value">—</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">CTR</span>
                <span id="post-ctr" class="metric-value">—</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Views</span>
                <span id="post-views" class="metric-value">—</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">AWT</span>
                <span id="post-awt" class="metric-value">—</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Retention</span>
                <span id="post-retention" class="metric-value">—</span>
              </div>
              <button id="copy-post-btn" class="copy-btn" data-period="post"><span class="btn-icon">📋</span> Copy Post</button>
            </div>
          </div>

          <!-- Export section -->
          <div class="export-section">
            <div class="export-helper">
              <span class="export-icon">📊</span>
              <div class="export-text">
                <div class="export-title">Export to Spreadsheet</div>
                <div class="export-subtitle">Paste into Google Sheets next to video title</div>
              </div>
            </div>
            <button id="copy-spreadsheet-btn" class="copy-btn export-btn">
              <span class="btn-icon">📋</span> Copy for Spreadsheet
            </button>
          </div>
        </div>

        <!-- Complete Analysis Results -->
        <div id="complete-results" class="complete-results" style="display: none;">

          <!-- Equal Periods Section -->
          <div class="complete-section">
            <div class="section-title">Equal Periods Comparison</div>
            <div class="metrics-grid">
              <div class="metrics-column pre-column">
                <div class="column-header">PRE</div>
                <div class="metric-row">
                  <span class="metric-label">Impressions</span>
                  <span id="complete-equal-pre-impressions" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">CTR</span>
                  <span id="complete-equal-pre-ctr" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Views</span>
                  <span id="complete-equal-pre-views" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">AWT</span>
                  <span id="complete-equal-pre-awt" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Retention</span>
                  <span id="complete-equal-pre-retention" class="metric-value">—</span>
                </div>
              </div>

              <div class="metrics-column post-column">
                <div class="column-header">POST</div>
                <div class="metric-row">
                  <span class="metric-label">Impressions</span>
                  <span id="complete-equal-post-impressions" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">CTR</span>
                  <span id="complete-equal-post-ctr" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Views</span>
                  <span id="complete-equal-post-views" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">AWT</span>
                  <span id="complete-equal-post-awt" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Retention</span>
                  <span id="complete-equal-post-retention" class="metric-value">—</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Lifetime Performance Section -->
          <div class="complete-section">
            <div class="section-title">Lifetime Performance</div>
            <div class="metrics-grid">
              <div class="metrics-column pre-column">
                <div class="column-header">PRE (Publish→Treatment)</div>
                <div class="metric-row">
                  <span class="metric-label">Impressions</span>
                  <span id="complete-lifetime-pre-impressions" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">CTR</span>
                  <span id="complete-lifetime-pre-ctr" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Views</span>
                  <span id="complete-lifetime-pre-views" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">AWT</span>
                  <span id="complete-lifetime-pre-awt" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Retention</span>
                  <span id="complete-lifetime-pre-retention" class="metric-value">—</span>
                </div>
              </div>

              <div class="metrics-column post-column">
                <div class="column-header">POST (Publish→Today)</div>
                <div class="metric-row">
                  <span class="metric-label">Impressions</span>
                  <span id="complete-lifetime-post-impressions" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">CTR</span>
                  <span id="complete-lifetime-post-ctr" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Views</span>
                  <span id="complete-lifetime-post-views" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">AWT</span>
                  <span id="complete-lifetime-post-awt" class="metric-value">—</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Retention</span>
                  <span id="complete-lifetime-post-retention" class="metric-value">—</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Complete Export Section -->
          <div class="export-section">
            <div class="export-helper">
              <span class="export-icon">📊</span>
              <div class="export-text">
                <div class="export-title">Export Complete Analysis</div>
                <div class="export-subtitle">All data in one row for spreadsheet</div>
              </div>
            </div>
            <button id="copy-complete-btn" class="copy-btn export-btn">
              <span class="btn-icon">📋</span> Copy Complete Data
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Setup auto-formatting for date inputs
  const treatmentDateInput = document.getElementById('treatment-date');
  autoFormatDateInput(treatmentDateInput);

  // Make panel draggable
  makePanelDraggable(panel);

  // Check saved visibility state
  safeStorage.get(['panelVisible']).then((result) => {
    if (result.panelVisible === false) {
      panel.style.display = 'none';
    }
  });

  // Event Listeners
  document.getElementById('helper-close').addEventListener('click', async () => {
    panel.style.display = 'none';
    // Save state
    await safeStorage.set({ panelVisible: false });
  });

  document.getElementById('calculate-btn').addEventListener('click', async () => {
    const treatmentDateDDMMYYYY = document.getElementById('treatment-date').value;

    // Log user action
    if (window.ExtensionLogger) {
      window.ExtensionLogger.logUserAction('Calculate button clicked', { treatmentDate: treatmentDateDDMMYYYY });
    }

    if (!treatmentDateDDMMYYYY) {
      alert('Please enter a treatment date (DD/MM/YYYY)');
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logWarning('Calculate clicked without treatment date');
      }
      return;
    }

    // Convert DD/MM/YYYY to YYYY-MM-DD for internal calculations
    const treatmentDate = formatDateToYYYYMMDD(treatmentDateDDMMYYYY);
    if (!treatmentDate) {
      alert('Invalid date format. Please use DD/MM/YYYY');
      return;
    }

    // Navigate to Analytics tab first to ensure we can get publish date
    try {
      await navigateToAnalyticsTab();
    } catch (error) {
      console.warn('Could not navigate to Analytics tab:', error);
    }

    // Wait a bit for Analytics page to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try to get video publish date from Analytics page
    const videoPublishDate = getVideoPublishDate();

    if (videoPublishDate) {
      console.log(`✅ Video publish date detected: ${formatDate(videoPublishDate)}`);

      // Set minimum date for treatment date picker to publish date
      const treatmentDateInput = document.getElementById('treatment-date');
      const publishDateStr = formatDate(videoPublishDate);
      treatmentDateInput.setAttribute('min', publishDateStr);
      console.log(`Set treatment date minimum to: ${publishDateStr}`);
    } else {
      console.warn('⚠️ Could not detect video publish date. PRE period may extend before video was published.');
    }

    // Validate: Treatment date cannot be before publish date
    const errorEl = document.getElementById('treatment-error');
    const warningEl = document.getElementById('period-warning');
    const extractBtn = document.getElementById('auto-extract-btn');

    if (videoPublishDate) {
      const treatment = new Date(treatmentDate);
      const publish = new Date(videoPublishDate);
      treatment.setHours(0, 0, 0, 0);
      publish.setHours(0, 0, 0, 0);

      if (treatment < publish) {
        // Treatment date is BEFORE video was published - this is invalid!
        console.error(`❌ Invalid: Treatment date ${formatDate(treatment)} is before publish date ${formatDate(publish)}`);

        // Show error message
        errorEl.style.display = 'block';
        warningEl.style.display = 'none';

        // Disable Extract button
        extractBtn.disabled = true;
        extractBtn.classList.add('disabled');

        // Still show the calculated periods (even though they're invalid) so user can see the problem
        document.getElementById('results-section').style.display = 'block';

        // Show "invalid" periods
        document.getElementById('pre-start').value = '';
        document.getElementById('pre-end').value = '';
        document.getElementById('pre-days').textContent = '—';

        // Convert treatment date to DD/MM/YYYY for display
        document.getElementById('post-start').value = formatDateToDDMMYYYY(treatmentDate);
        document.getElementById('post-start').dataset.original = treatmentDate;
        document.getElementById('post-end').value = '';
        document.getElementById('post-days').textContent = '—';

        // Scroll to show the error
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        return; // Stop here - don't calculate ranges
      }
    }

    // Valid treatment date - proceed with calculation
    errorEl.style.display = 'none';
    extractBtn.disabled = false;
    extractBtn.classList.remove('disabled');

    let ranges;
    try {
      ranges = calculateDateRanges(treatmentDate, videoPublishDate);
    } catch (error) {
      alert(error.message);
      return;
    }

    // Display results (convert YYYY-MM-DD to DD/MM/YYYY for display)
    document.getElementById('pre-start').value = formatDateToDDMMYYYY(ranges.pre.start);
    document.getElementById('pre-start').dataset.original = ranges.pre.start; // Keep YYYY-MM-DD for calculations
    document.getElementById('pre-end').value = formatDateToDDMMYYYY(ranges.pre.end);
    document.getElementById('pre-end').dataset.original = ranges.pre.end;
    document.getElementById('pre-days').textContent = ranges.pre.days;

    document.getElementById('post-start').value = formatDateToDDMMYYYY(ranges.post.start);
    document.getElementById('post-start').dataset.original = ranges.post.start;
    document.getElementById('post-end').value = formatDateToDDMMYYYY(ranges.post.end);
    document.getElementById('post-end').dataset.original = ranges.post.end;
    document.getElementById('post-days').textContent = ranges.post.days;

    // Store video publish date for lifetime mode extraction
    if (videoPublishDate) {
      document.getElementById('pre-start').dataset.videoPublishDate = formatDate(videoPublishDate);
    }

    // Check if period was limited by publish date or available data
    const maxPossiblePostDays = ranges.daysSince + 1;
    const maxPossiblePreDays = ranges.videoPublishDate ?
      Math.floor((new Date(treatmentDate) - new Date(ranges.videoPublishDate)) / (1000 * 60 * 60 * 24)) :
      maxPossiblePostDays;

    if (ranges.pre.days < maxPossiblePostDays && maxPossiblePreDays < maxPossiblePostDays) {
      const warningMsg = `ℹ️ Using ${ranges.pre.days}-day periods (limited by video publish date on ${formatDateDisplay(ranges.videoPublishDate)}). ${maxPossiblePostDays - ranges.pre.days} days of POST data available but unused for fair comparison.`;
      console.log(warningMsg);

      // Show info in UI
      warningEl.innerHTML = warningMsg;
      warningEl.style.display = 'block';
      warningEl.style.background = '#e3f2fd';
      warningEl.style.color = '#1976d2';
    } else if (ranges.pre.days < maxPossiblePostDays) {
      const warningMsg = `ℹ️ Using ${ranges.pre.days}-day periods (limited by available POST data). Both periods are equal for fair comparison.`;
      console.log(warningMsg);

      // Show info in UI
      warningEl.innerHTML = warningMsg;
      warningEl.style.display = 'block';
      warningEl.style.background = '#e3f2fd';
      warningEl.style.color = '#1976d2';
    } else {
      // Hide warning if periods are equal
      warningEl.style.display = 'none';
    }

    document.getElementById('results-section').style.display = 'block';
    document.getElementById('extraction-mode-section').style.display = 'block';

    // Scroll to results
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Save to storage for future use (save in DD/MM/YYYY format for UI compatibility)
    safeStorage.set({
      lastTreatmentDate: treatmentDateDDMMYYYY,
      lastCalculatedRanges: ranges,
      videoPublishDate: videoPublishDate ? formatDate(videoPublishDate) : null
    });
  });

  // Helper: Calculate days between two dates
  function calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end
    return diffDays;
  }

  // Helper: Validate and update date ranges after manual edit
  function validateAndUpdateDateRanges() {
    const preStartDD = document.getElementById('pre-start').value;
    const preEndDD = document.getElementById('pre-end').value;
    const postStartDD = document.getElementById('post-start').value;
    const postEndDD = document.getElementById('post-end').value;
    const warningEl = document.getElementById('period-warning');
    const extractBtn = document.getElementById('auto-extract-btn');

    // Check all dates are filled
    if (!preStartDD || !preEndDD || !postStartDD || !postEndDD) {
      console.warn('Not all dates filled');
      return;
    }

    // Convert DD/MM/YYYY to YYYY-MM-DD for calculations
    const preStart = formatDateToYYYYMMDD(preStartDD);
    const preEnd = formatDateToYYYYMMDD(preEndDD);
    const postStart = formatDateToYYYYMMDD(postStartDD);
    const postEnd = formatDateToYYYYMMDD(postEndDD);

    if (!preStart || !preEnd || !postStart || !postEnd) {
      console.warn('Invalid date format');
      return;
    }

    // Update dataset.original with converted dates for extraction
    document.getElementById('pre-start').dataset.original = preStart;
    document.getElementById('pre-end').dataset.original = preEnd;
    document.getElementById('post-start').dataset.original = postStart;
    document.getElementById('post-end').dataset.original = postEnd;

    // Calculate days for each period
    const preDays = calculateDaysBetween(preStart, preEnd);
    const postDays = calculateDaysBetween(postStart, postEnd);

    // Update day displays
    document.getElementById('pre-days').textContent = preDays;
    document.getElementById('post-days').textContent = postDays;

    // Validate date order
    const preStartDate = new Date(preStart);
    const preEndDate = new Date(preEnd);
    const postStartDate = new Date(postStart);
    const postEndDate = new Date(postEnd);

    let hasError = false;
    let warningMsg = '';

    // Check: PRE start <= PRE end
    if (preStartDate > preEndDate) {
      warningMsg = '❌ PRE period: Start date must be before or equal to end date';
      hasError = true;
    }
    // Check: POST start <= POST end
    else if (postStartDate > postEndDate) {
      warningMsg = '❌ POST period: Start date must be before or equal to end date';
      hasError = true;
    }
    // Check: PRE end < POST start (periods shouldn't overlap)
    else if (preEndDate >= postStartDate) {
      warningMsg = '❌ PRE period must end before POST period starts';
      hasError = true;
    }
    // Check: Days are positive
    else if (preDays <= 0 || postDays <= 0) {
      warningMsg = '❌ Period must be at least 1 day long';
      hasError = true;
    }
    // Warning: Unequal periods
    else if (preDays !== postDays) {
      warningMsg = `⚠️ Warning: PRE (${preDays}d) and POST (${postDays}d) periods have different lengths. This may affect comparison fairness.`;
      hasError = false; // Warning, not error
    }

    // Show/hide warning
    if (warningMsg) {
      warningEl.innerHTML = warningMsg;
      warningEl.style.display = 'block';
      if (hasError) {
        warningEl.style.background = '#ffebee';
        warningEl.style.color = '#c62828';
        extractBtn.disabled = true;
        extractBtn.classList.add('disabled');
      } else {
        warningEl.style.background = '#fff3e0';
        warningEl.style.color = '#e65100';
        extractBtn.disabled = false;
        extractBtn.classList.remove('disabled');
      }
    } else {
      warningEl.style.display = 'none';
      extractBtn.disabled = false;
      extractBtn.classList.remove('disabled');
    }

    console.log(`Date ranges updated: PRE ${preDays}d, POST ${postDays}d`);

    // Log user action
    if (window.ExtensionLogger) {
      window.ExtensionLogger.logUserAction('Dates manually edited', {
        preStart, preEnd, preDays,
        postStart, postEnd, postDays,
        valid: !hasError
      });
    }
  }

  // Add change listeners to all date inputs
  document.querySelectorAll('.date-edit').forEach(input => {
    input.addEventListener('change', () => {
      validateAndUpdateDateRanges();
    });
  });

  // Edit dates button functionality
  panel.addEventListener('click', (e) => {
    const editBtn = e.target.closest('#edit-dates-btn');
    if (editBtn || e.target.id === 'edit-dates-btn') {
      e.preventDefault();
      e.stopPropagation();

      const dateInputs = document.querySelectorAll('.date-edit');
      const isEditing = editBtn.textContent.trim() === 'Done';

      if (isEditing) {
        // Save and lock - validate one final time
        validateAndUpdateDateRanges();

        dateInputs.forEach(input => {
          input.disabled = true;
          input.classList.remove('editable');
        });
        editBtn.textContent = 'Edit';
        editBtn.classList.remove('editing');
        console.log('Dates locked');

        // Log user action
        if (window.ExtensionLogger) {
          window.ExtensionLogger.logUserAction('Edit dates completed', {
            preStart: document.getElementById('pre-start').value,
            preEnd: document.getElementById('pre-end').value,
            postStart: document.getElementById('post-start').value,
            postEnd: document.getElementById('post-end').value
          });
        }
      } else {
        // Enable editing
        dateInputs.forEach(input => {
          input.disabled = false;
          input.classList.add('editable');
          // Add auto-formatting to each date input
          autoFormatDateInput(input);
        });
        editBtn.textContent = 'Done';
        editBtn.classList.add('editing');
        console.log('Dates now editable - enter dates in DD/MM/YYYY format');

        // Log user action
        if (window.ExtensionLogger) {
          window.ExtensionLogger.logUserAction('Edit dates started');
        }
      }
    }
  });

  // Copy period for Airtable functionality
  document.querySelectorAll('.copy-btn[data-period]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.currentTarget; // Use currentTarget to always get the button, not the clicked span
      const period = button.getAttribute('data-period');

      // Get metrics in order: CTR, Views, AWT, Retention
      const ctr = document.getElementById(`${period}-ctr`).textContent;
      const views = document.getElementById(`${period}-views`).textContent;
      const awt = document.getElementById(`${period}-awt`).textContent;
      const retention = document.getElementById(`${period}-retention`).textContent;

      // Format as tab-separated values for Airtable
      const airtableFormat = `${ctr}\t${views}\t${awt}\t${retention}`;

      navigator.clipboard.writeText(airtableFormat).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');

        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 1500);
      });
    });
  });

  // Helper: Format date ranges for spreadsheet
  const formatDateRangesForSpreadsheet = () => {
    // Get dates in YYYY-MM-DD format from dataset.original
    const preStart = document.getElementById('pre-start').dataset.original;
    const preEnd = document.getElementById('pre-end').dataset.original;
    const postStart = document.getElementById('post-start').dataset.original;
    const postEnd = document.getElementById('post-end').dataset.original;

    if (!preStart || !preEnd || !postStart || !postEnd) {
      return '';
    }

    // Convert YYYY-MM-DD to DD.MM.YYYY
    const formatDateDDMMYYYY = (dateStr) => {
      const [year, month, day] = dateStr.split('-');
      return `${day}.${month}.${year}`;
    };

    const preStartFormatted = formatDateDDMMYYYY(preStart);
    const preEndFormatted = formatDateDDMMYYYY(preEnd);
    const postStartFormatted = formatDateDDMMYYYY(postStart);
    const postEndFormatted = formatDateDDMMYYYY(postEnd);

    // Format as: "Pre - DD.MM.YYYY-DD.MM.YYYY Post- DD.MM.YYYY-DD.MM.YYYY"
    return `Pre - ${preStartFormatted}-${preEndFormatted} Post- ${postStartFormatted}-${postEndFormatted}`;
  };

  // Helper: Convert YYYY-MM-DD to DD.MM.YYYY
  const formatDateToDDMMYYYYWithDots = (dateStr) => {
    if (!dateStr) return '';
    // Handle YYYY-MM-DD format
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
    }
    // Handle DD/MM/YYYY format - convert to DD.MM.YYYY
    if (dateStr.includes('/')) {
      return dateStr.replace(/\//g, '.');
    }
    return dateStr;
  };

  // Copy for Spreadsheet (Tab-separated)
  document.getElementById('copy-spreadsheet-btn').addEventListener('click', (e) => {
    const treatmentDate = formatDateRangesForSpreadsheet();
    const preImpressions = document.getElementById('pre-impressions').textContent;
    const postImpressions = document.getElementById('post-impressions').textContent;
    const preCtr = document.getElementById('pre-ctr').textContent;
    const postCtr = document.getElementById('post-ctr').textContent;
    const preAwt = document.getElementById('pre-awt').textContent;
    const postAwt = document.getElementById('post-awt').textContent;
    const preRetention = document.getElementById('pre-retention').textContent;
    const postRetention = document.getElementById('post-retention').textContent;
    const preViews = document.getElementById('pre-views').textContent;
    const postViews = document.getElementById('post-views').textContent;

    // Format: treatment date, pre-impressions, post-impressions, empty, pre-ctr, post-ctr, empty, pre-awt, post-awt, pre-retention, post-retention, pre-views, post-views
    // No leading tab so user can paste one column to the right of video title without overwriting it
    const tabFormat = `${treatmentDate}\t${preImpressions}\t${postImpressions}\t\t${preCtr}\t${postCtr}\t\t${preAwt}\t${postAwt}\t${preRetention}\t${postRetention}\t${preViews}\t${postViews}`;

    navigator.clipboard.writeText(tabFormat).then(() => {
      const btn = e.target.closest('button');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
      btn.classList.add('copied');

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('copied');
      }, 1500);
    });
  });

  // Copy Complete Analysis (Tab-separated with all data)
  document.getElementById('copy-complete-btn').addEventListener('click', (e) => {
    if (!window.completeAnalysisData) {
      alert('No data available. Please extract metrics first.');
      return;
    }

    const data = window.completeAnalysisData;

    // Format dates as DD.MM.YYYY
    const publishDate = formatDateToDDMMYYYYWithDots(data.dates.publishDate);
    const treatmentDate = formatDateToDDMMYYYYWithDots(data.dates.treatmentDate);
    const extractionDate = formatDateToDDMMYYYYWithDots(data.dates.extractionDate);

    // Equal Periods metrics
    const equalPreImpr = data.equal.pre.impressions || '';
    const equalPreViews = data.equal.pre.views || '';
    const equalPreCtr = data.equal.pre.ctr || '';
    const equalPreAwt = data.equal.pre.awt || '';
    const equalPreRet = data.equal.pre.retention?.value || '';

    const equalPostImpr = data.equal.post.impressions || '';
    const equalPostViews = data.equal.post.views || '';
    const equalPostCtr = data.equal.post.ctr || '';
    const equalPostAwt = data.equal.post.awt || '';
    const equalPostRet = data.equal.post.retention?.value || '';

    // Lifetime metrics
    const lifePreImpr = data.lifetime.pre.impressions || '';
    const lifePreViews = data.lifetime.pre.views || '';
    const lifePreCtr = data.lifetime.pre.ctr || '';
    const lifePreAwt = data.lifetime.pre.awt || '';
    const lifePreRet = data.lifetime.pre.retention?.value || '';

    const lifePostImpr = data.lifetime.post.impressions || '';
    const lifePostViews = data.lifetime.post.views || '';
    const lifePostCtr = data.lifetime.post.ctr || '';
    const lifePostAwt = data.lifetime.post.awt || '';
    const lifePostRet = data.lifetime.post.retention?.value || '';

    // Format: Dates (3) | Equal Periods with Change columns (15) | Separators (2) | Lifetime with Change columns (15)
    // Total: 35 columns
    const tabFormat = [
      publishDate,
      treatmentDate,
      extractionDate,
      // Equal Periods: PRE | POST | Change (empty) for each metric
      equalPreImpr,
      equalPostImpr,
      '', // Change
      equalPreViews,
      equalPostViews,
      '', // Change
      equalPreCtr,
      equalPostCtr,
      '', // Change
      equalPreAwt,
      equalPostAwt,
      '', // Change
      equalPreRet,
      equalPostRet,
      '', // Change
      '', // separator
      '', // separator
      // Lifetime: PRE | POST | Change (empty) for each metric
      lifePreImpr,
      lifePostImpr,
      '', // Change
      lifePreViews,
      lifePostViews,
      '', // Change
      lifePreCtr,
      lifePostCtr,
      '', // Change
      lifePreAwt,
      lifePostAwt,
      '', // Change
      lifePreRet,
      lifePostRet,
      '' // Change
    ].join('\t');

    navigator.clipboard.writeText(tabFormat).then(() => {
      const btn = e.target.closest('button');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
      btn.classList.add('copied');

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('copied');
      }, 1500);
    });
  });

  // Auto-Extract button functionality with retry logic
  let extractionAttempts = 0;
  const maxAttempts = 2;
  let extractionCancelled = false;
  let partialData = { pre: null, post: null };

  // Tab change detection
  let wasHidden = false;
  document.addEventListener('visibilitychange', () => {
    const autoExtractBtn = document.getElementById('auto-extract-btn');
    if (document.hidden && autoExtractBtn && autoExtractBtn.disabled) {
      wasHidden = true;
    } else if (!document.hidden && wasHidden) {
      wasHidden = false;
      const statusEl = document.getElementById('extraction-status');
      if (statusEl && statusEl.style.display !== 'none') {
        statusEl.innerHTML = '⚠️ Tab was switched during extraction. Results may be incomplete.<br>Please try again.';
        statusEl.className = 'extraction-status error';
      }
    }
  });

  // Cancel button
  document.getElementById('cancel-extract-btn').addEventListener('click', () => {
    extractionCancelled = true;
    const statusEl = document.getElementById('extraction-status');
    statusEl.textContent = '🛑 Extraction cancelled by user';
    statusEl.className = 'extraction-status error';
    document.getElementById('cancel-extract-btn').style.display = 'none';
    document.getElementById('auto-extract-btn').disabled = false;
    document.getElementById('progress-container').style.display = 'none';
  });

  const runExtraction = async (isRetry = false) => {
    // Use dataset.original which stores YYYY-MM-DD format for internal use
    const preStart = document.getElementById('pre-start').dataset.original;
    const preEnd = document.getElementById('pre-end').dataset.original;
    const postStart = document.getElementById('post-start').dataset.original;
    const postEnd = document.getElementById('post-end').dataset.original;

    const statusEl = document.getElementById('extraction-status');
    const autoExtractBtn = document.getElementById('auto-extract-btn');
    const cancelBtn = document.getElementById('cancel-extract-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');

    let currentStep = '';
    let totalSteps = 18; // Granular progress with 18 steps
    let currentStepNum = 0;

    const updateProgress = (step, stepNum) => {
      currentStep = step;
      currentStepNum = stepNum;
      const percentage = Math.round((stepNum / totalSteps) * 100);

      // Store progress in DOM for persistence across page changes
      progressContainer.dataset.currentStep = stepNum;
      progressContainer.dataset.currentPercentage = percentage;

      // Apply visual updates - force style to persist
      progressFill.style.width = `${percentage}%`;
      progressPercent.textContent = `${percentage}%`;
      statusEl.textContent = step;

      // Force layout recalculation to ensure changes are applied
      void progressFill.offsetHeight;
    };

    extractionCancelled = false;

    try {
      // Show UI
      statusEl.style.display = 'block';
      statusEl.className = 'extraction-status';
      autoExtractBtn.disabled = true;
      cancelBtn.style.display = 'block';
      progressContainer.style.display = 'block';

      // Restore progress if this is a retry or continuation
      if (progressContainer.dataset.currentStep && !isRetry) {
        const savedStep = parseInt(progressContainer.dataset.currentStep);
        const savedPercentage = parseInt(progressContainer.dataset.currentPercentage);
        progressFill.style.width = `${savedPercentage}%`;
        progressPercent.textContent = `${savedPercentage}%`;
        currentStepNum = savedStep;
      }

      updateProgress('Starting extraction...', 0);

      // Check if on Advanced Mode page
      if (!window.location.href.includes('/explore?')) {
        updateProgress('🔄 Navigating to Advanced Mode...', 0);
        await navigateToAdvancedMode();
        if (extractionCancelled) throw new Error('Cancelled by user');
      }

      const updateStatus = (message) => {
        if (extractionCancelled) throw new Error('Cancelled by user');

        // Map messages to step numbers (18 granular steps total)
        if (message.includes('Opening metrics picker')) updateProgress(message, 1);
        else if (message.includes('Selecting required metrics')) updateProgress(message, 2);
        else if (message.includes('Opening date picker for PRE')) updateProgress(message, 3);
        else if (message.includes('Setting PRE period dates')) updateProgress(message, 4);
        else if (message.includes('Waiting for PRE data')) updateProgress(message, 5);
        else if (message.includes('Reading PRE metrics')) updateProgress(message, 6);
        else if (message.includes('Opening date picker for POST')) updateProgress(message, 7);
        else if (message.includes('Setting POST period dates')) updateProgress(message, 8);
        else if (message.includes('Waiting for POST data')) updateProgress(message, 9);
        else if (message.includes('Reading POST metrics')) updateProgress(message, 10);
        else if (message.includes('Opening report menu')) updateProgress(message, 11);
        else if (message.includes('Switching to Audience Retention')) updateProgress(message, 12);
        else if (message.includes('Waiting for retention chart')) updateProgress(message, 13);
        else if (message.includes('Setting PRE dates for retention')) updateProgress(message, 14);
        else if (message.includes('Reading PRE retention')) updateProgress(message, 15);
        else if (message.includes('Setting POST dates for retention')) updateProgress(message, 16);
        else if (message.includes('Reading POST retention')) updateProgress(message, 17);
        else if (message.includes('Switching back to metrics')) updateProgress(message, 18);
        else statusEl.textContent = message;
      };

      // Run extraction (always include retention)
      currentStep = 'Extracting metrics';
      const result = await extractPrePostMetrics(
        preStart, preEnd,
        postStart, postEnd,
        updateStatus,
        true // Always extract retention
      );

      // Display results
      document.getElementById('pre-impressions').textContent = result.pre.impressions || '—';
      document.getElementById('pre-views').textContent = result.pre.views || '—';
      document.getElementById('pre-ctr').textContent = result.pre.ctr || '—';
      document.getElementById('pre-awt').textContent = result.pre.awt || '—';
      document.getElementById('pre-retention').textContent = result.pre.retention?.value || 'N/A';

      document.getElementById('post-impressions').textContent = result.post.impressions || '—';
      document.getElementById('post-views').textContent = result.post.views || '—';
      document.getElementById('post-ctr').textContent = result.post.ctr || '—';
      document.getElementById('post-awt').textContent = result.post.awt || '—';
      document.getElementById('post-retention').textContent = result.post.retention?.value || 'N/A';

      // Update displayed date ranges based on extraction mode
      if (window.currentExtractionMode === 'lifetime') {
        // For lifetime mode, update the displayed dates to show the actual ranges used
        // PRE: publish → treatment
        document.getElementById('pre-start').value = formatDateToDDMMYYYY(preStart);
        document.getElementById('pre-end').value = formatDateToDDMMYYYY(preEnd);
        const preDays = calculateDaysBetween(preStart, preEnd);
        document.getElementById('pre-days').textContent = preDays;

        // POST: publish → today
        document.getElementById('post-start').value = formatDateToDDMMYYYY(postStart);
        document.getElementById('post-end').value = formatDateToDDMMYYYY(postEnd);
        const postDays = calculateDaysBetween(postStart, postEnd);
        document.getElementById('post-days').textContent = postDays;

        // Show Copy Pre/Post buttons for Airtable, hide spreadsheet button
        document.getElementById('copy-pre-btn').style.display = 'inline-flex';
        document.getElementById('copy-post-btn').style.display = 'inline-flex';
        document.getElementById('copy-spreadsheet-btn').parentElement.style.display = 'none';
      } else {
        // Equal periods mode: show spreadsheet button, hide individual copy buttons
        document.getElementById('copy-pre-btn').style.display = 'none';
        document.getElementById('copy-post-btn').style.display = 'none';
        document.getElementById('copy-spreadsheet-btn').parentElement.style.display = 'block';
      }

      document.getElementById('metrics-results').style.display = 'block';

      // Scroll to bottom to show results
      const helperBody = document.querySelector('.helper-body');
      if (helperBody) {
        setTimeout(() => {
          helperBody.scrollTo({
            top: helperBody.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }

      updateProgress('✅ Complete!', totalSteps);
      statusEl.textContent = '✅ Metrics extracted successfully!';
      statusEl.className = 'extraction-status success';
      cancelBtn.style.display = 'none';

      // Reset attempt counter on success
      extractionAttempts = 0;

      // Log successful extraction
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logInfo('Extraction completed successfully', {
          preStart,
          preEnd,
          postStart,
          postEnd,
          metrics: {
            pre: result.pre,
            post: result.post
          }
        });
      }

      // Save to storage
      safeStorage.set({
        lastExtractedMetrics: result
      });

    } catch (error) {
      console.error('Extraction failed:', error);

      // Log extraction error
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logError('Extraction failed', error, {
          currentStep,
          currentStepNum,
          extractionAttempts,
          isRetry,
          preStart,
          preEnd,
          postStart,
          postEnd
        });
      }

      extractionAttempts++;
      cancelBtn.style.display = 'none';

      // Check if cancelled
      if (error.message === 'Cancelled by user') {
        if (window.ExtensionLogger) {
          window.ExtensionLogger.logInfo('Extraction cancelled by user');
        }
        return; // Already handled by cancel button
      }

      // Check if it's an extension context error
      if (!isExtensionContextValid()) {
        statusEl.innerHTML = `❌ Extension reloaded. Please <strong>refresh this page</strong> (F5) to continue.`;
        statusEl.className = 'extraction-status error';
        progressContainer.style.display = 'none';
        alert('The extension was reloaded.\n\nPlease refresh this page (press F5) and try again.');

        if (window.ExtensionLogger) {
          window.ExtensionLogger.logError('Extension context invalid during extraction', error);
        }
      } else {
        // Build helpful error message
        let errorMsg = `❌ Failed at: ${currentStep}\n`;
        errorMsg += `Error: ${error.message}`;

        if (extractionAttempts < maxAttempts && !isRetry) {
          // First failure - auto-retry after 2 seconds
          errorMsg += `\n\n🔄 Auto-retrying in 2 seconds...`;
          statusEl.innerHTML = errorMsg.replace(/\n/g, '<br>');
          statusEl.className = 'extraction-status error';

          if (window.ExtensionLogger) {
            window.ExtensionLogger.logInfo('Auto-retrying extraction after failure', {
              attempt: extractionAttempts
            });
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
          return runExtraction(true); // Retry
        } else {
          // Second failure - suggest page refresh
          errorMsg += `\n\n💡 Please refresh the page (F5) and try again.`;
          statusEl.innerHTML = errorMsg.replace(/\n/g, '<br>');
          statusEl.className = 'extraction-status error';
          progressContainer.style.display = 'none';

          // Show alert for critical failures
          if (error.message.includes('not found') || error.message.includes('Timeout')) {
            alert('Extraction failed twice.\n\nPlease:\n1. Refresh the page (F5)\n2. Make sure you\'re on a video analytics page\n3. Try again');
          }
        }
      }
    } finally {
      autoExtractBtn.disabled = false;
    }
  };

  // Complete Analysis function
  const runCompleteAnalysis = async (ranges) => {
    const autoExtractBtn = document.getElementById('auto-extract-btn');
    const statusEl = document.getElementById('extraction-status');
    const cancelBtn = document.getElementById('cancel-extract-btn');

    autoExtractBtn.disabled = true;
    statusEl.style.display = 'block';
    cancelBtn.style.display = 'inline-block';

    try {
      // Hide existing single-mode results
      document.getElementById('metrics-results').style.display = 'none';

      // Navigate to Advanced Mode if not already there
      if (!window.location.href.includes('/explore?')) {
        statusEl.textContent = '🔄 Navigating to Advanced Mode...';
        statusEl.className = 'extraction-status info';
        await navigateToAdvancedMode();
      }

      // Step 1: Extract Equal Periods data
      statusEl.textContent = '📊 Extracting equal periods data...';
      statusEl.className = 'extraction-status info';

      const equalResult = await extractPrePostMetrics(
        ranges.equalPreStart, ranges.equalPreEnd,
        ranges.equalPostStart, ranges.equalPostEnd,
        (msg) => { statusEl.textContent = msg; },
        true
      );

      // Step 2: Extract Lifetime data
      statusEl.textContent = '📊 Extracting lifetime data...';

      const lifetimeResult = await extractPrePostMetrics(
        ranges.lifetimePreStart, ranges.lifetimePreEnd,
        ranges.lifetimePostStart, ranges.lifetimePostEnd,
        (msg) => { statusEl.textContent = msg; },
        true
      );

      // Store both results globally
      window.completeAnalysisData = {
        equal: equalResult,
        lifetime: lifetimeResult,
        dates: {
          publishDate: ranges.lifetimePreStart,
          treatmentDate: ranges.lifetimePreEnd,
          extractionDate: formatDate(new Date())
        }
      };

      // Display Equal Periods results
      document.getElementById('complete-equal-pre-impressions').textContent = equalResult.pre.impressions || '—';
      document.getElementById('complete-equal-pre-views').textContent = equalResult.pre.views || '—';
      document.getElementById('complete-equal-pre-ctr').textContent = equalResult.pre.ctr || '—';
      document.getElementById('complete-equal-pre-awt').textContent = equalResult.pre.awt || '—';
      document.getElementById('complete-equal-pre-retention').textContent = equalResult.pre.retention?.value || 'N/A';

      document.getElementById('complete-equal-post-impressions').textContent = equalResult.post.impressions || '—';
      document.getElementById('complete-equal-post-views').textContent = equalResult.post.views || '—';
      document.getElementById('complete-equal-post-ctr').textContent = equalResult.post.ctr || '—';
      document.getElementById('complete-equal-post-awt').textContent = equalResult.post.awt || '—';
      document.getElementById('complete-equal-post-retention').textContent = equalResult.post.retention?.value || 'N/A';

      // Display Lifetime results
      document.getElementById('complete-lifetime-pre-impressions').textContent = lifetimeResult.pre.impressions || '—';
      document.getElementById('complete-lifetime-pre-views').textContent = lifetimeResult.pre.views || '—';
      document.getElementById('complete-lifetime-pre-ctr').textContent = lifetimeResult.pre.ctr || '—';
      document.getElementById('complete-lifetime-pre-awt').textContent = lifetimeResult.pre.awt || '—';
      document.getElementById('complete-lifetime-pre-retention').textContent = lifetimeResult.pre.retention?.value || 'N/A';

      document.getElementById('complete-lifetime-post-impressions').textContent = lifetimeResult.post.impressions || '—';
      document.getElementById('complete-lifetime-post-views').textContent = lifetimeResult.post.views || '—';
      document.getElementById('complete-lifetime-post-ctr').textContent = lifetimeResult.post.ctr || '—';
      document.getElementById('complete-lifetime-post-awt').textContent = lifetimeResult.post.awt || '—';
      document.getElementById('complete-lifetime-post-retention').textContent = lifetimeResult.post.retention?.value || 'N/A';

      // Show complete results section
      document.getElementById('complete-results').style.display = 'block';

      // Scroll to bottom
      const helperBody = document.querySelector('.helper-body');
      if (helperBody) {
        setTimeout(() => {
          helperBody.scrollTo({
            top: helperBody.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }

      statusEl.textContent = '✅ Complete analysis extracted successfully!';
      statusEl.className = 'extraction-status success';
      cancelBtn.style.display = 'none';

    } catch (error) {
      console.error('Complete analysis failed:', error);
      statusEl.textContent = `❌ Failed: ${error.message}`;
      statusEl.className = 'extraction-status error';
      cancelBtn.style.display = 'none';
    } finally {
      autoExtractBtn.disabled = false;
    }
  };

  // Extract button click handler
  document.getElementById('auto-extract-btn').addEventListener('click', async () => {
    // Check which extraction mode is selected
    const extractionMode = document.querySelector('input[name="extraction-mode"]:checked').value;

    // Store extraction mode globally so copy buttons know which format to use
    window.currentExtractionMode = extractionMode;

    if (extractionMode === 'complete') {
      // Complete analysis: Extract both equal periods and lifetime
      const treatmentDate = document.getElementById('treatment-date').value;
      const treatmentDateYYYYMMDD = formatDateToYYYYMMDD(treatmentDate);
      const videoPublishDateStr = document.getElementById('pre-start').dataset.videoPublishDate;

      if (!videoPublishDateStr || !treatmentDateYYYYMMDD) {
        alert('Please calculate date ranges first');
        return;
      }

      // Log user action
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logUserAction('Extract button clicked (Complete Analysis mode)');
      }

      // Store calculated equal periods ranges
      const equalPreStart = document.getElementById('pre-start').dataset.original;
      const equalPreEnd = document.getElementById('pre-end').dataset.original;
      const equalPostStart = document.getElementById('post-start').dataset.original;
      const equalPostEnd = document.getElementById('post-end').dataset.original;

      // Calculate lifetime ranges
      const today = new Date();
      today.setDate(today.getDate() - 2);
      const todayStr = formatDate(today);

      // Run complete analysis
      await runCompleteAnalysis({
        equalPreStart,
        equalPreEnd,
        equalPostStart,
        equalPostEnd,
        lifetimePreStart: videoPublishDateStr,
        lifetimePreEnd: treatmentDateYYYYMMDD,
        lifetimePostStart: videoPublishDateStr,
        lifetimePostEnd: todayStr
      });

      return; // Exit early since we have a separate function for complete analysis
    } else if (extractionMode === 'lifetime') {
      // Calculate lifetime ranges: publish → treatment, publish → today
      const treatmentDate = document.getElementById('treatment-date').value;
      const treatmentDateYYYYMMDD = formatDateToYYYYMMDD(treatmentDate);

      // Get video publish date (stored during calculate)
      const videoPublishDateStr = document.getElementById('pre-start').dataset.videoPublishDate;

      if (!videoPublishDateStr || !treatmentDateYYYYMMDD) {
        alert('Please calculate date ranges first');
        return;
      }

      // Calculate today (or yesterday, as YouTube data is typically 2 days behind)
      const today = new Date();
      today.setDate(today.getDate() - 2); // YouTube data is ~2 days behind
      const todayStr = formatDate(today);

      // Set lifetime ranges in dataset.original for extraction
      // PRE: publish → treatment
      document.getElementById('pre-start').dataset.original = videoPublishDateStr;
      document.getElementById('pre-end').dataset.original = treatmentDateYYYYMMDD;

      // POST: publish → today
      document.getElementById('post-start').dataset.original = videoPublishDateStr;
      document.getElementById('post-end').dataset.original = todayStr;

      // Log user action
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logUserAction('Extract button clicked (Lifetime mode)', {
          prePeriod: `${videoPublishDateStr} to ${treatmentDateYYYYMMDD}`,
          postPeriod: `${videoPublishDateStr} to ${todayStr}`
        });
      }
    } else {
      // Equal periods mode - use existing calculated ranges
      const preStart = document.getElementById('pre-start').value;
      const preEnd = document.getElementById('pre-end').value;
      const postStart = document.getElementById('post-start').value;
      const postEnd = document.getElementById('post-end').value;

      // Log user action
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logUserAction('Extract button clicked (Equal Periods mode)', {
          preStart,
          preEnd,
          postStart,
          postEnd
        });
      }

      if (!preStart || !preEnd || !postStart || !postEnd) {
        alert('Please calculate date ranges first');
        if (window.ExtensionLogger) {
          window.ExtensionLogger.logWarning('Extract clicked without date ranges');
        }
        return;
      }
    }

    await runExtraction(false);
  });


  // Load last used treatment date if available
  safeStorage.get(['lastTreatmentDate']).then((result) => {
    if (result.lastTreatmentDate) {
      let dateToDisplay = result.lastTreatmentDate;

      // Handle backward compatibility: if stored date is YYYY-MM-DD, convert to DD/MM/YYYY
      if (dateToDisplay.includes('-')) {
        dateToDisplay = formatDateToDDMMYYYY(dateToDisplay);
      }

      document.getElementById('treatment-date').value = dateToDisplay;
    }
  });
}

// Add toggle button to YouTube Studio header
function addToggleButton() {
  // Wait for YouTube Studio header to load
  const checkHeader = setInterval(() => {
    const header = document.querySelector('ytcp-app-header') ||
                   document.querySelector('.ytcp-header') ||
                   document.querySelector('#header');

    if (header && !document.getElementById('treatment-helper-toggle')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'treatment-helper-toggle';
      toggleBtn.className = 'treatment-helper-toggle';
      toggleBtn.textContent = 'Treatment Comparison';
      toggleBtn.title = 'Open Treatment Date Comparison Helper';

      toggleBtn.addEventListener('click', async () => {
        const panel = document.getElementById('yt-treatment-helper');
        if (panel) {
          const isVisible = panel.style.display !== 'none';
          panel.style.display = isVisible ? 'none' : 'block';
          // Save state
          await safeStorage.set({ panelVisible: !isVisible });
        } else {
          createHelperPanel();
        }
      });

      header.appendChild(toggleBtn);
      clearInterval(checkHeader);
    }
  }, 1000);

  // Stop checking after 10 seconds
  setTimeout(() => clearInterval(checkHeader), 10000);
}

// // Helper: Extract video ID from URL
// function getVideoIdFromUrl() {
//   const match = window.location.pathname.match(/\/video\/([^\/]+)\//);
//   return match ? match[1] : null;
// }

// Helper: Reset form when video changes
function resetFormForNewVideo() {
  console.log('🔄 New video detected - resetting form');

  // Clear results section
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.style.display = 'none';
  }

  // Clear date inputs
  const preStart = document.getElementById('pre-start');
  const preEnd = document.getElementById('pre-end');
  const postStart = document.getElementById('post-start');
  const postEnd = document.getElementById('post-end');

  if (preStart) preStart.value = '';
  if (preEnd) preEnd.value = '';
  if (postStart) postStart.value = '';
  if (postEnd) postEnd.value = '';

  // Clear treatment date min attribute (from previous video)
  const treatmentDateInput = document.getElementById('treatment-date');
  if (treatmentDateInput) {
    treatmentDateInput.removeAttribute('min');
  }

  // Clear error/warning messages
  const errorEl = document.getElementById('treatment-error');
  const warningEl = document.getElementById('period-warning');
  if (errorEl) errorEl.style.display = 'none';
  if (warningEl) warningEl.style.display = 'none';

  // Re-enable extract button
  const extractBtn = document.getElementById('auto-extract-btn');
  if (extractBtn) {
    extractBtn.disabled = false;
    extractBtn.classList.remove('disabled');
  }
}

// Monitor URL changes to detect video navigation
let currentVideoId = null;

function watchForVideoChanges() {
  const checkVideoChange = () => {
    const newVideoId = getVideoIdFromUrl();

    if (newVideoId && newVideoId !== currentVideoId) {
      console.log(`📹 Video changed: ${currentVideoId || 'none'} → ${newVideoId}`);
      currentVideoId = newVideoId;

      // Reset form when video changes
      resetFormForNewVideo();
    }
  };

  // Check immediately
  currentVideoId = getVideoIdFromUrl();

  // Check periodically (YouTube Studio is a SPA, URL changes without page reload)
  setInterval(checkVideoChange, 1000);

  // Also watch for history changes
  const pushState = history.pushState;
  history.pushState = function() {
    pushState.apply(history, arguments);
    setTimeout(checkVideoChange, 100);
  };

  const replaceState = history.replaceState;
  history.replaceState = function() {
    replaceState.apply(history, arguments);
    setTimeout(checkVideoChange, 100);
  };

  window.addEventListener('popstate', () => {
    setTimeout(checkVideoChange, 100);
  });
}

// Initialize when page loads
function init() {
  console.log('YouTube Treatment Comparison Helper loaded');

  // Only run on YouTube Studio Analytics pages
  if (window.location.hostname === 'studio.youtube.com') {
    addToggleButton();
    createHelperPanel();
    watchForVideoChanges(); // Start monitoring for video changes
  }
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
