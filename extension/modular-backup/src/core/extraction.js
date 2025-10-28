/**
 * Metrics extraction and date manipulation
 */

import { SELECTORS, TIMEOUTS, METRICS, MESSAGES } from '../config/constants.js';
import { waitForElement, waitForElementRemoval } from '../utils/domHelpers.js';
import { registerObserver } from '../index.js';
import { navigateBackToMetrics } from './navigation.js';

/**
 * Set custom date range in YouTube Studio Analytics
 */
export async function setCustomDateRange(startDate, endDate) {
  console.log(`Setting date range: ${startDate} to ${endDate}`);

  // Find the time picker
  const timePicker = document.querySelector(SELECTORS.TIME_PICKER);
  if (!timePicker) {
    throw new Error('Time picker not found');
  }

  // Find and click the date trigger
  const dateTrigger = timePicker.querySelector(SELECTORS.DATE_TRIGGER);
  if (!dateTrigger) {
    throw new Error('Date trigger not found');
  }

  const triggerText = dateTrigger.textContent.trim();
  console.log(`Found date trigger with text: "${triggerText}"`);

  // Close any existing dropdown first
  const existingDropdown = document.querySelector(`${SELECTORS.DROPDOWN_MENU}[aria-hidden="false"]`);
  if (existingDropdown) {
    console.log('Closing existing dropdown first...');
    document.body.click();
    await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));
  }

  // Click to open dropdown
  console.log('Clicked date trigger, waiting for dropdown menu...');
  dateTrigger.click();
  await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));

  // Wait for dropdown to appear
  let visibleDropdown = null;

  console.log('Waiting for dropdown menu to appear...');

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Dropdown timeout')), 5000);

      // Use MutationObserver to detect when dropdown appears
      const observer = new MutationObserver(() => {
        const dropdowns = document.querySelectorAll(SELECTORS.DROPDOWN_MENU);
        for (const dropdown of dropdowns) {
          if (dropdown.getAttribute('aria-hidden') === 'false' &&
              dropdown.offsetParent !== null) {
            visibleDropdown = dropdown;
            console.log('Dropdown detected via MutationObserver');
            observer.disconnect();
            clearTimeout(timeout);
            resolve();
            return;
          }
        }
      }, 100);

      registerObserver(observer);
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } catch (error) {
    console.warn('Could not detect dropdown visibility, attempting to find Custom option anyway...');
    const allDropdowns = document.querySelectorAll(SELECTORS.DROPDOWN_MENU);
    for (const dropdown of allDropdowns) {
      const customOption = dropdown.querySelector(SELECTORS.CUSTOM_OPTION);
      if (customOption) {
        console.log('Found Custom option in a dropdown, proceeding...');
        visibleDropdown = dropdown;
        break;
      }
    }

    if (!visibleDropdown) {
      throw new Error(MESSAGES.ERRORS.NO_DROPDOWN);
    }
  }

  // Find custom option with retry logic
  let customOption = visibleDropdown.querySelector(SELECTORS.CUSTOM_OPTION);

  if (!customOption) {
    const allOptions = visibleDropdown.querySelectorAll('tp-yt-paper-item');
    console.warn(`Custom option not found on first try. Found ${allOptions.length} options:`,
      Array.from(allOptions).map(o => o.getAttribute('test-id')).filter(Boolean));

    console.log('Waiting 1 second for dropdown to fully populate...');
    await new Promise(resolve => setTimeout(resolve, TIMEOUTS.DROPDOWN_WAIT));

    customOption = visibleDropdown.querySelector(SELECTORS.CUSTOM_OPTION);

    if (!customOption) {
      console.log('Trying alternate selectors for Custom option...');
      const allItems = visibleDropdown.querySelectorAll('tp-yt-paper-item');
      for (const item of allItems) {
        if (item.textContent.toLowerCase().includes('custom')) {
          customOption = item;
          console.log('Found Custom option by text content');
          break;
        }
      }
    }

    if (!customOption) {
      console.error('Custom option still not found after retry. Available options:',
        Array.from(allOptions).map(o => ({
          testId: o.getAttribute('test-id'),
          text: o.textContent.trim()
        })));
      throw new Error(MESSAGES.ERRORS.NO_CUSTOM_OPTION);
    }
  }

  console.log('Custom option found in visible dropdown');
  customOption.click();
  await new Promise(resolve => setTimeout(resolve, TIMEOUTS.MEDIUM));

  // Find visible date picker dialog
  const allDateDialogs = document.querySelectorAll(SELECTORS.DATE_DIALOG);
  let dateDialog = null;

  for (const dialog of allDateDialogs) {
    if (dialog.offsetParent !== null) {
      dateDialog = dialog;
      console.log('Found VISIBLE date picker dialog');
      break;
    }
  }

  if (!dateDialog) {
    throw new Error(MESSAGES.ERRORS.NO_DATE_PICKER);
  }

  // Get date inputs
  const startInput = dateDialog.querySelector('#start-date input');
  const endInput = dateDialog.querySelector('#end-date input');
  const applyButton = dateDialog.querySelector('#apply-button');

  if (!startInput || !endInput || !applyButton) {
    throw new Error('Date inputs or apply button not found');
  }

  // Detect date format from placeholder
  const placeholder = startInput.getAttribute('placeholder') || 'DD/MM/YYYY';
  const locale = navigator.language || 'en-US';
  console.log(`Using date format: ${placeholder} (detected locale: ${locale})`);

  // Format dates based on detected format
  const formatDateForInput = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    if (placeholder.includes('MM/DD')) {
      return `${month}/${day}/${year}`;
    } else {
      return `${day}/${month}/${year}`;
    }
  };

  const formattedStart = formatDateForInput(startDate);
  const formattedEnd = formatDateForInput(endDate);

  console.log(`Setting dates: ${formattedStart} to ${formattedEnd}`);

  // Set dates with strategy
  const startDay = parseInt(startDate.split('-')[2]);
  const endDay = parseInt(endDate.split('-')[2]);
  const currentStartDay = parseInt(startInput.value.split('/')[0]) || 0;
  const currentEndDay = parseInt(endInput.value.split('/')[0]) || 0;

  console.log(`   Cached: START=${currentStartDay}, END=${currentEndDay}`);
  console.log(`   Target: START=${startDay}, END=${endDay}`);

  const isExpanding = startDay <= currentStartDay && endDay >= currentEndDay;
  const strategy = isExpanding ? 'END first (expanding forward)' : 'START first (contracting backward)';
  console.log(`   Strategy: ${strategy}: ${startDay}-${endDay} vs cached ${currentStartDay}-${currentEndDay}`);

  // Set dates in correct order
  if (isExpanding) {
    console.log(`   Setting End: target="${formattedEnd}"`);
    endInput.value = formattedEnd;
    endInput.dispatchEvent(new Event('input', { bubbles: true }));
    endInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`   After setting: input.value="${endInput.value}"`);

    console.log(`   Setting Start: target="${formattedStart}"`);
    startInput.value = formattedStart;
    startInput.dispatchEvent(new Event('input', { bubbles: true }));
    startInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`   After setting: input.value="${startInput.value}"`);
  } else {
    console.log(`   Setting Start: target="${formattedStart}"`);
    startInput.value = formattedStart;
    startInput.dispatchEvent(new Event('input', { bubbles: true }));
    startInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`   After setting: input.value="${startInput.value}"`);

    console.log(`   Setting End: target="${formattedEnd}"`);
    endInput.value = formattedEnd;
    endInput.dispatchEvent(new Event('input', { bubbles: true }));
    endInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`   After setting: input.value="${endInput.value}"`);
  }

  await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));

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

  if (errorMessages.length > 0) {
    const errorSummary = errorMessages.join('; ');
    console.error(`   ❌ ABORTING: Validation errors prevent date change: ${errorSummary}`);

    const cancelButton = dateDialog.querySelector('#cancel-button, [aria-label="Cancel"]');
    if (cancelButton) {
      cancelButton.click();
      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));
    }

    throw new Error(`YouTube validation failed: ${errorSummary}. The dates you're trying to set are outside YouTube's allowed range. Please check that your dates are not in the future.`);
  }

  // Get sidebar date before clicking Apply
  const sidebar = document.querySelector(SELECTORS.TIME_PICKER);
  const getSidebarDateText = () => {
    const triggers = sidebar.querySelectorAll(SELECTORS.DATE_TRIGGER);
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

  // Click Apply
  console.log('   Clicking Apply button...');
  applyButton.focus();
  await new Promise(resolve => setTimeout(resolve, 100));
  applyButton.click();
  applyButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

  const actualButton = applyButton.querySelector('button');
  if (actualButton) {
    console.log('   Also clicking inner button element...');
    actualButton.click();
  }

  // Wait for dialog to close
  console.log('   Waiting for dialog to close...');
  let dialogClosed = false;
  for (let i = 0; i < 30; i++) {
    if (dateDialog.offsetParent === null) {
      dialogClosed = true;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Wait for sidebar to update
  console.log('   Waiting for sidebar to update...');
  let sidebarUpdated = false;
  const targetStartDay = startDate.split('-')[2].replace(/^0/, '');
  const targetEndDay = endDate.split('-')[2].replace(/^0/, '');

  for (let i = 0; i < 30; i++) {
    const currentSidebarText = getSidebarDateText();
    if (currentSidebarText !== beforeDate) {
      sidebarUpdated = true;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  if (!sidebarUpdated) {
    console.log(`   ⚠️ WARNING: Sidebar did not change after 6000ms`);
  }

  const finalSidebarText = getSidebarDateText();

  console.log(`✅ Date range applied successfully!`);
  console.log(`   Requested: ${formattedStart} - ${formattedEnd}`);
  console.log(`   Sidebar shows: "${finalSidebarText}"`);

  // Verify dates in sidebar
  const startDayFound = finalSidebarText.includes(targetStartDay);
  const endDayFound = finalSidebarText.includes(targetEndDay);

  console.log(`   Checking dates: start day "${targetStartDay}" found: ${startDayFound}, end day "${targetEndDay}" found: ${endDayFound}`);

  if (startDayFound && endDayFound) {
    console.log(`   ✅ Both dates verified in sidebar!`);
  } else {
    console.error(`⚠️ ERROR: Dates were NOT applied correctly!`);
    console.error(`   Requested: ${formattedStart} - ${formattedEnd} (days: ${targetStartDay} to ${targetEndDay})`);
    console.error(`   Sidebar shows: "${finalSidebarText}"`);
    console.error(`   Missing: ${!startDayFound ? 'START date' : ''} ${!endDayFound ? 'END date' : ''}`);
    console.error(`   Common causes:`);
    console.error(`   - Dates are in the future or today (YouTube only has data up to yesterday)`);
    console.error(`   - YouTube's date picker validation rejected the input`);
    console.error(`   - Date format mismatch`);
    throw new Error(`${MESSAGES.ERRORS.DATE_VALIDATION_FAILED}. ${!startDayFound ? 'START' : 'END'} date was not applied. Requested: ${formattedStart} - ${formattedEnd}`);
  }

  console.log(`   Waiting for table/chart to refresh...`);
  await new Promise(resolve => setTimeout(resolve, TIMEOUTS.PAGE_LOAD));
  console.log(`   Data should be refreshed, proceeding to extraction...`);
}

/**
 * Select metrics in Advanced Mode
 */
export async function selectMetrics() {
  console.log('Selecting metrics...');

  const metricsToSelect = Object.values(METRICS);

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
    await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SHORT));
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

/**
 * Extract metric values from the table
 */
export async function extractMetricValues() {
  console.log('Extracting values...');

  // Wait for table to load AND have data rows
  console.log('Waiting for table with data to load...');
  await waitForElement(SELECTORS.EXPLORE_TABLE, TIMEOUTS.NAVIGATION);

  // Wait for actual data rows to appear (table might exist but be empty)
  const startTime = Date.now();
  const maxWait = 10000;
  let table, row;

  while (Date.now() - startTime < maxWait) {
    table = document.querySelector(SELECTORS.EXPLORE_TABLE);
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

/**
 * Main extraction function for PRE and POST metrics
 */
export async function extractPrePostMetrics(preRange, postRange) {
  const results = {
    pre: null,
    post: null
  };

  // Extract PRE metrics
  console.log(`\n=== Extracting PRE metrics (${preRange.start} to ${preRange.end}) ===`);
  await setCustomDateRange(preRange.start, preRange.end);
  results.pre = await extractMetricValues();

  // Extract POST metrics
  console.log(`\n=== Extracting POST metrics (${postRange.start} to ${postRange.end}) ===`);
  await setCustomDateRange(postRange.start, postRange.end);
  results.post = await extractMetricValues();

  return results;
}
