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

// Check if extension context is still valid
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

// Helper: Wait for element to appear in DOM
function waitForElement(selector, timeout = 10000) {
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
}

// Helper: Wait for element to disappear from DOM
function waitForElementRemoval(selector, timeout = 5000) {
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
}

// Helper: Wait for URL to match pattern
function waitForUrlChange(urlPattern, timeout = 10000) {
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

// Utility: Format date as YYYY-MM-DD (for internal use)
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Utility: Format date as DD/MM/YY (for display)
function formatDateDisplay(dateStr) {
  // Input: "2025-10-24" (YYYY-MM-DD)
  // Output: "24/10/25" (DD/MM/YY)
  const [year, month, day] = dateStr.split('-');
  const shortYear = year.slice(-2);
  return `${day}/${month}/${shortYear}`;
}

// Core Logic: Calculate PRE and POST date ranges
function calculateDateRanges(treatmentDate) {
  const treatment = new Date(treatmentDate);
  const today = new Date();

  // YouTube Analytics only has data up to YESTERDAY (not today)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Calculate days since treatment (up to yesterday)
  const daysSince = Math.floor((yesterday - treatment) / (1000 * 60 * 60 * 24));

  // POST period: Treatment day to YESTERDAY (not today - YouTube doesn't have today's data yet)
  const postStart = new Date(treatment);
  const postEnd = new Date(yesterday);
  const postDays = daysSince + 1; // Including treatment day

  // PRE period: Same number of days as POST, BEFORE treatment
  // If POST is 8 days, PRE should also be 8 days
  const preStart = new Date(treatment);
  preStart.setDate(preStart.getDate() - postDays);
  const preEnd = new Date(treatment);
  preEnd.setDate(preEnd.getDate() - 1); // Day before treatment
  const preDays = postDays; // Same as POST

  return {
    daysSince: daysSince,
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
async function setCustomDateRange(startDate, endDate) {
  console.log(`Setting date range: ${startDate} to ${endDate}`);

  const sidebar = document.querySelector('yta-explore-sidebar');
  if (!sidebar) throw new Error('Sidebar not found');

  const triggers = sidebar.querySelectorAll('ytcp-dropdown-trigger');
  let dateTrigger = null;

  for (const trigger of triggers) {
    const text = trigger.textContent;
    if (text.includes('–') || text.includes('Since') || text.includes('days')) {
      dateTrigger = trigger;
      break;
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

  // Focus and click the trigger to open dropdown
  dateTrigger.focus();
  await new Promise(resolve => setTimeout(resolve, 50));
  dateTrigger.click();
  console.log('Clicked date trigger, waiting for dropdown menu...');

  // Wait for a VISIBLE dropdown to appear (not just any dropdown in DOM)
  console.log('Waiting for VISIBLE dropdown menu...');
  let visibleDropdown = null;
  const maxAttempts = 20; // 20 attempts x 250ms = 5 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const dropdowns = document.querySelectorAll('tp-yt-paper-listbox[role="listbox"]');
    for (const dropdown of dropdowns) {
      // Check if dropdown is actually visible
      if (dropdown.offsetParent !== null) {
        visibleDropdown = dropdown;
        console.log(`Visible dropdown found after ${i * 250}ms`);
        break;
      }
    }
    if (visibleDropdown) break;

    console.log(`Attempt ${i + 1}/${maxAttempts}: No visible dropdown yet, waiting...`);
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  if (!visibleDropdown) {
    console.error('No visible dropdown appeared after clicking date trigger');
    throw new Error('Date dropdown did not open');
  }

  // Now find the custom option in the VISIBLE dropdown
  const customOption = visibleDropdown.querySelector('tp-yt-paper-item[test-id="fixed"]');

  if (!customOption) {
    // Debug: show what options ARE available in the visible dropdown
    const allOptions = visibleDropdown.querySelectorAll('tp-yt-paper-item');
    console.error(`Custom option not found in visible dropdown. Found ${allOptions.length} options:`,
      Array.from(allOptions).map(o => o.getAttribute('test-id')).filter(Boolean));
    throw new Error('Custom date option not found in dropdown');
  }

  console.log('Custom option found in visible dropdown');

  customOption.click();
  await new Promise(resolve => setTimeout(resolve, 800));

  const dateDialog = document.querySelector('ytcp-date-period-picker');
  if (!dateDialog) throw new Error('Date picker not found');

  const startInput = dateDialog.querySelector('#start-date input');
  const endInput = dateDialog.querySelector('#end-date input');

  if (!startInput || !endInput) throw new Error('Input elements not found');

  // Get cached values from dialog
  const cachedStart = startInput.value;
  const cachedEnd = endInput.value;
  console.log(`   Dialog opened - pre-filled values: start="${cachedStart}", end="${cachedEnd}"`);

  // Detect date format based on browser locale
  const useDDMMYYYY = () => {
    const locale = navigator.language || 'en-US';
    // Countries that use DD/MM/YYYY: India, UK, Australia, most of Europe, etc.
    const ddmmCountries = ['en-IN', 'en-GB', 'en-AU', 'en-NZ', 'en-ZA', 'hi-IN',
                           'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru'];
    return ddmmCountries.some(country => locale.startsWith(country.split('-')[0]));
  };

  const formatDateForInput = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    // Use DD/MM/YYYY for India and most non-US countries
    if (useDDMMYYYY()) {
      return `${day}/${month}/${year}`;
    }
    // Use MM/DD/YYYY for US
    return `${month}/${day}/${year}`;
  };

  const formattedStart = formatDateForInput(startDate);
  const formattedEnd = formatDateForInput(endDate);

  // Log format being used for debugging
  const locale = navigator.language || 'en-US';
  const format = useDDMMYYYY() ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
  console.log(`Using date format: ${format} (detected locale: ${locale})`);
  console.log(`Setting dates: ${formattedStart} to ${formattedEnd}`);

  // Function to set date input value using NATIVE SETTER (more reliable)
  // IMPORTANT: Does NOT blur - matches standalone script that works
  const setDateInput = async (input, value, label) => {
    console.log(`   Setting ${label}: target="${value}"`);

    // Get the native setter (bypasses React/custom setters)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

    // Focus the input
    input.focus();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Set value using native setter
    nativeInputValueSetter.call(input, value);
    console.log(`   After native setter: input.value="${input.value}"`);

    // Trigger events
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // DO NOT blur() - let next focus handle unfocusing
    // Blurring triggers YouTube's formatter which changes "06/10/2025" to "6 Oct 2025"
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log(`   After events: input.value="${input.value}"`);
  };

  // SMART ORDERING: Decide which date to set first based on cached vs target values
  // This prevents YouTube's validation from rejecting changes

  // Helper to parse date string to comparable number (day of month)
  const parseDay = (dateStr) => {
    if (!dateStr) return 0;
    // Extract day number from DD/MM/YYYY or MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length >= 2) {
      // For DD/MM/YYYY, day is first; for MM/DD/YYYY, day is second
      return useDDMMYYYY() ? parseInt(parts[0]) : parseInt(parts[1]);
    }
    // If format is "16 Oct 2025", extract the number
    const match = dateStr.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const cachedStartDay = parseDay(cachedStart);
  const cachedEndDay = parseDay(cachedEnd);
  const targetStartDay = parseDay(formattedStart);
  const targetEndDay = parseDay(formattedEnd);

  console.log(`   Cached: START=${cachedStartDay}, END=${cachedEndDay}`);
  console.log(`   Target: START=${targetStartDay}, END=${targetEndDay}`);

  // Decide order based on relationship between cached and target values
  let setEndFirst = true; // Default to END first

  if (cachedStartDay > 0 && cachedEndDay > 0) {
    // Strategy: Always set the date that's expanding the range FIRST
    // This prevents YouTube's validation from rejecting the change

    // If moving the range forward in time (target START >= cached END)
    if (targetStartDay >= cachedEndDay) {
      setEndFirst = true; // Set END first to expand range upward
      console.log(`   Strategy: END first (expanding forward: ${targetStartDay}-${targetEndDay} vs cached ${cachedStartDay}-${cachedEndDay})`);
    }
    // If moving the range backward in time (target END <= cached START)
    else if (targetEndDay <= cachedStartDay) {
      setEndFirst = false; // Set START first to expand range downward
      console.log(`   Strategy: START first (expanding backward: ${targetStartDay}-${targetEndDay} vs cached ${cachedStartDay}-${cachedEndDay})`);
    }
    // If ranges overlap, check which direction we're primarily moving
    else if (targetStartDay > cachedStartDay) {
      setEndFirst = false; // Moving start forward, set START first
      console.log(`   Strategy: START first (start moving forward: ${targetStartDay}-${targetEndDay} vs cached ${cachedStartDay}-${cachedEndDay})`);
    } else {
      setEndFirst = true; // Moving end or overlapping, set END first
      console.log(`   Strategy: END first (default overlap: ${targetStartDay}-${targetEndDay} vs cached ${cachedStartDay}-${cachedEndDay})`);
    }
  } else {
    console.log(`   Strategy: END first (default - no cached values)`);
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

  // CRITICAL: Wait for YouTube's async validation to complete
  console.log(`   Waiting 500ms for YouTube validation...`);
  await new Promise(resolve => setTimeout(resolve, 500));

  // AGGRESSIVE FIX: Force-correct any reformatted dates RIGHT before Apply
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

  console.log(`   Final check before Apply:`);
  console.log(`      START current: "${startInput.value}" (want: "${formattedStart}")`);
  console.log(`      END current: "${endInput.value}" (want: "${formattedEnd}")`);

  // If YouTube reformatted them, force them back
  if (startInput.value !== formattedStart) {
    console.log(`      ⚠️ START was reformatted! Forcing back to ${formattedStart}`);
    startInput.focus();
    nativeInputValueSetter.call(startInput, formattedStart);
    startInput.dispatchEvent(new Event('input', { bubbles: true }));
    startInput.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (endInput.value !== formattedEnd) {
    console.log(`      ⚠️ END was reformatted! Forcing back to ${formattedEnd}`);
    endInput.focus();
    nativeInputValueSetter.call(endInput, formattedEnd);
    endInput.dispatchEvent(new Event('input', { bubbles: true }));
    endInput.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const applyButton = dateDialog.querySelector('#apply-button');
  if (!applyButton) throw new Error('Apply button not found');

  // FINAL CHECK: Log values RIGHT before clicking Apply
  console.log(`   Final values before Apply:`);
  console.log(`      START: "${startInput.value}"`);
  console.log(`      END: "${endInput.value}"`);
  console.log(`      Apply button disabled: ${applyButton.disabled || applyButton.getAttribute('aria-disabled')}`);

  // Check for validation errors
  const errors = dateDialog.querySelectorAll('.error, [role="alert"], .validation-error');
  if (errors.length > 0) {
    console.log(`   ⚠️ VALIDATION ERRORS FOUND:`);
    errors.forEach((err, i) => {
      console.log(`      ${i + 1}. ${err.textContent.trim()}`);
    });
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
  console.log(`   Waiting for table to refresh...`);

  // Note: Dialog auto-closes after Apply, no need to manually close
  // ESC key was breaking the UI by closing the advanced metrics tab
}

// Helper: Select Metrics
async function selectMetrics() {
  console.log('Selecting metrics...');

  const metricsToSelect = [
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

    if (headerLower === 'views') {
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

// Helper: Navigate to Advanced Mode
async function navigateToAdvancedMode() {
  console.log('Navigating to Advanced Mode...');

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

  // Wait for retention chart to load
  await waitForElement('yta-line-chart-base svg', 10000);

  console.log('Navigated to Audience Retention');
}

// Helper: Navigate back to metrics table report
async function navigateBackToMetrics() {
  console.log('Navigating back to metrics table...');

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

  // Wait for dropdown menu to appear
  await waitForElement('tp-yt-paper-item', 3000);

  // Find and click "Top content in the past 28 days" option (default metrics view)
  const menuItems = Array.from(document.querySelectorAll('tp-yt-paper-item'));
  let topContentOption = null;

  for (const item of menuItems) {
    const text = item.textContent.trim();
    // Match "Top content in the past 28 days" (with or without nbsp)
    if (text.includes('Top content in the past 28') && text.includes('days')) {
      topContentOption = item;
      break;
    }
  }

  if (!topContentOption) {
    throw new Error('Top content in the past 28 days option not found');
  }

  topContentOption.click();

  // Wait for metrics table to load
  await waitForElement('yta-explore-table.data-container', 10000);

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
    if (statusCallback) statusCallback('🔧 Selecting metrics...');
    await selectMetrics();

    if (statusCallback) statusCallback('📅 Setting PRE period...');
    await setCustomDateRange(preStart, preEnd);

    if (statusCallback) statusCallback('📥 Extracting PRE metrics...');
    const preMetrics = await extractValues();

    if (statusCallback) statusCallback('📅 Setting POST period...');
    await setCustomDateRange(postStart, postEnd);

    if (statusCallback) statusCallback('📥 Extracting POST metrics...');
    const postMetrics = await extractValues();

    // Extract retention if enabled
    let preRetention = null;
    let postRetention = null;

    if (includeRetention) {
      try {
        if (statusCallback) statusCallback('📊 Navigating to Audience Retention...');
        await navigateToAudienceRetention();

        if (statusCallback) statusCallback('📊 Extracting PRE retention...');
        await setCustomDateRange(preStart, preEnd);
        preRetention = await extractRetentionMetric();

        if (statusCallback) statusCallback('📊 Extracting POST retention...');
        await setCustomDateRange(postStart, postEnd);
        postRetention = await extractRetentionMetric();

        if (statusCallback) statusCallback('📊 Returning to metrics table...');
        await navigateBackToMetrics();

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

// UI: Create floating panel
function createHelperPanel() {
  // Check if panel already exists
  if (document.getElementById('yt-treatment-helper')) {
    return;
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
        <div class="step-label">Select treatment date</div>
        <div class="input-section">
          <input type="date" id="treatment-date" class="date-input" max="" />
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
                <input type="date" id="pre-start" class="date-edit" disabled />
              </div>
              <div class="date-row">
                <label class="date-label">End</label>
                <input type="date" id="pre-end" class="date-edit" disabled />
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
                <input type="date" id="post-start" class="date-edit" disabled />
              </div>
              <div class="date-row">
                <label class="date-label">End</label>
                <input type="date" id="post-end" class="date-edit" disabled />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Extract -->
        <button id="auto-extract-btn" class="action-btn extract-btn">
          <span class="btn-icon">📊</span> Extract Metrics
        </button>
        <div id="extraction-status" class="extraction-status" style="display: none;"></div>

        <!-- Step 4: Results -->
        <div id="metrics-results" class="metrics-results" style="display: none;">
          <div class="metrics-grid">
            <div class="metrics-column pre-column">
              <div class="column-header">PRE</div>
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
                <span class="metric-label">Consumption</span>
                <span id="pre-consumption" class="metric-value">—</span>
              </div>
              <button class="copy-btn" data-period="pre"><span class="btn-icon">📋</span> Copy to Airtable</button>
            </div>

            <div class="metrics-column post-column">
              <div class="column-header">POST</div>
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
                <span class="metric-label">Consumption</span>
                <span id="post-consumption" class="metric-value">—</span>
              </div>
              <button class="copy-btn" data-period="post"><span class="btn-icon">📋</span> Copy to Airtable</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Set max date to yesterday (YouTube doesn't have today's data)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const maxDate = yesterday.toISOString().split('T')[0];
  document.getElementById('treatment-date').setAttribute('max', maxDate);

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

  document.getElementById('calculate-btn').addEventListener('click', () => {
    const treatmentDate = document.getElementById('treatment-date').value;

    if (!treatmentDate) {
      alert('Please select a treatment date');
      return;
    }

    const ranges = calculateDateRanges(treatmentDate);

    // Display results (use YYYY-MM-DD for date inputs)
    document.getElementById('pre-start').value = ranges.pre.start;
    document.getElementById('pre-start').dataset.original = ranges.pre.start;
    document.getElementById('pre-end').value = ranges.pre.end;
    document.getElementById('pre-end').dataset.original = ranges.pre.end;
    document.getElementById('pre-days').textContent = ranges.pre.days;

    document.getElementById('post-start').value = ranges.post.start;
    document.getElementById('post-start').dataset.original = ranges.post.start;
    document.getElementById('post-end').value = ranges.post.end;
    document.getElementById('post-end').dataset.original = ranges.post.end;
    document.getElementById('post-days').textContent = ranges.post.days;

    document.getElementById('results-section').style.display = 'block';

    // Scroll to results
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Save to storage for future use
    safeStorage.set({
      lastTreatmentDate: treatmentDate,
      lastCalculatedRanges: ranges
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
        // Save and lock
        dateInputs.forEach(input => {
          input.disabled = true;
          input.classList.remove('editable');
        });
        editBtn.textContent = 'Edit';
        editBtn.classList.remove('editing');
        console.log('Dates locked');
      } else {
        // Enable editing
        dateInputs.forEach(input => {
          input.disabled = false;
          input.classList.add('editable');
        });
        editBtn.textContent = 'Done';
        editBtn.classList.add('editing');
        console.log('Dates now editable - you can click to open calendar');
      }
    }
  });

  // Copy period for Airtable functionality
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const period = e.target.getAttribute('data-period');

      // Get metrics in order: CTR, Views, AWT, Consumption
      const ctr = document.getElementById(`${period}-ctr`).textContent;
      const views = document.getElementById(`${period}-views`).textContent;
      const awt = document.getElementById(`${period}-awt`).textContent;
      const consumption = document.getElementById(`${period}-consumption`).textContent;

      // Format as tab-separated values for Airtable
      const airtableFormat = `${ctr}\t${views}\t${awt}\t${consumption}`;

      navigator.clipboard.writeText(airtableFormat).then(() => {
        const originalText = e.target.textContent;
        e.target.textContent = 'Copied!';
        e.target.classList.add('copied');

        setTimeout(() => {
          e.target.textContent = originalText;
          e.target.classList.remove('copied');
        }, 1500);
      });
    });
  });

  // Auto-Extract button functionality
  document.getElementById('auto-extract-btn').addEventListener('click', async () => {
    // Get the actual dates from the inputs (user may have edited them)
    const preStart = document.getElementById('pre-start').value;
    const preEnd = document.getElementById('pre-end').value;
    const postStart = document.getElementById('post-start').value;
    const postEnd = document.getElementById('post-end').value;

    if (!preStart || !preEnd || !postStart || !postEnd) {
      alert('Please calculate date ranges first');
      return;
    }

    const statusEl = document.getElementById('extraction-status');
    const autoExtractBtn = document.getElementById('auto-extract-btn');

    try {
      // Check if on Advanced Mode page, if not navigate there
      if (!window.location.href.includes('/explore?')) {
        statusEl.style.display = 'block';
        statusEl.className = 'extraction-status';
        statusEl.textContent = '🔄 Navigating to Advanced Mode...';
        autoExtractBtn.disabled = true;

        await navigateToAdvancedMode();
      }
      // Show status, disable button
      statusEl.style.display = 'block';
      statusEl.className = 'extraction-status';
      autoExtractBtn.disabled = true;

      const updateStatus = (message) => {
        statusEl.textContent = message;
      };

      // Run extraction (always include retention)
      const result = await extractPrePostMetrics(
        preStart, preEnd,
        postStart, postEnd,
        updateStatus,
        true // Always extract retention
      );

      // Display results
      document.getElementById('pre-views').textContent = result.pre.views || '—';
      document.getElementById('pre-ctr').textContent = result.pre.ctr || '—';
      document.getElementById('pre-awt').textContent = result.pre.awt || '—';
      document.getElementById('pre-consumption').textContent = result.pre.consumption || '—';
      document.getElementById('pre-retention').textContent = result.pre.retention?.value || 'N/A';

      document.getElementById('post-views').textContent = result.post.views || '—';
      document.getElementById('post-ctr').textContent = result.post.ctr || '—';
      document.getElementById('post-awt').textContent = result.post.awt || '—';
      document.getElementById('post-consumption').textContent = result.post.consumption || '—';
      document.getElementById('post-retention').textContent = result.post.retention?.value || 'N/A';

      document.getElementById('metrics-results').style.display = 'block';

      statusEl.textContent = '✅ Metrics extracted successfully!';
      statusEl.className = 'extraction-status success';

      // Save to storage
      safeStorage.set({
        lastExtractedMetrics: result
      });

    } catch (error) {
      console.error('Extraction failed:', error);

      // Check if it's an extension context error
      if (!isExtensionContextValid()) {
        statusEl.innerHTML = `❌ Extension reloaded. Please <strong>refresh this page</strong> (F5) to continue.`;
        statusEl.className = 'extraction-status error';
        alert('The extension was reloaded.\n\nPlease refresh this page (press F5) and try again.');
      } else {
        statusEl.textContent = `❌ Error: ${error.message}`;
        statusEl.className = 'extraction-status error';
      }
    } finally {
      autoExtractBtn.disabled = false;
    }
  });


  // Load last used treatment date if available
  safeStorage.get(['lastTreatmentDate']).then((result) => {
    if (result.lastTreatmentDate) {
      document.getElementById('treatment-date').value = result.lastTreatmentDate;
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

// Initialize when page loads
function init() {
  console.log('YouTube Treatment Comparison Helper loaded');

  // Only run on YouTube Studio Analytics pages
  if (window.location.hostname === 'studio.youtube.com') {
    addToggleButton();
    createHelperPanel();
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
