/**
 * Navigation helpers for YouTube Studio Analytics
 */

import { SELECTORS, TIMEOUTS, URL_PATTERNS, MESSAGES } from '../config/constants.js';
import { waitForElement, waitForUrlChange } from '../utils/domHelpers.js';

/**
 * Check if currently on Analytics tab
 */
export function isOnAnalyticsTab() {
  return URL_PATTERNS.ANALYTICS.test(window.location.href);
}

/**
 * Navigate to Analytics tab if not already there
 */
export async function navigateToAnalyticsTab() {
  console.log('Checking if on Analytics tab...');

  if (isOnAnalyticsTab()) {
    console.log('Already on Analytics tab');
    return;
  }

  console.log('Not on Analytics tab, navigating there...');

  // Find the Analytics navigation link
  const navLinks = Array.from(document.querySelectorAll(SELECTORS.ANALYTICS_TAB));
  let analyticsLink = null;

  for (const link of navLinks) {
    const linkText = link.textContent.toLowerCase();
    const href = link.getAttribute('href') || '';

    if (linkText.includes('analytics') && href.includes('/analytics/')) {
      analyticsLink = link;
      console.log(`Found Analytics link with href: ${href}`);
      break;
    }
  }

  if (!analyticsLink) {
    // Try alternative selector
    const analyticsItem = document.querySelector(SELECTORS.ANALYTICS_ICON);
    if (analyticsItem) {
      const parentLink = analyticsItem.closest(SELECTORS.ANALYTICS_TAB);
      if (parentLink) {
        analyticsLink = parentLink;
        console.log('Found Analytics link via icon item');
      }
    }
  }

  if (!analyticsLink) {
    throw new Error(MESSAGES.ERRORS.NO_ANALYTICS_LINK);
  }

  analyticsLink.click();
  await waitForUrlChange('/analytics/', TIMEOUTS.NAVIGATION);
  await new Promise(resolve => setTimeout(resolve, TIMEOUTS.LONG));

  console.log(MESSAGES.SUCCESS.NAVIGATED_TO_ANALYTICS);
}

/**
 * Navigate to Advanced Mode
 */
export async function navigateToAdvancedMode() {
  console.log('Navigating to Advanced Mode...');

  // Ensure we're on Analytics tab first
  await navigateToAnalyticsTab();

  // Find Advanced mode button
  const advancedButton = document.querySelector(SELECTORS.ADVANCED_BUTTON);
  if (!advancedButton) {
    throw new Error(MESSAGES.ERRORS.NO_ADVANCED_BUTTON);
  }

  advancedButton.click();

  await waitForUrlChange('/explore?', TIMEOUTS.NAVIGATION);
  await waitForElement(SELECTORS.EXPLORE_TABLE, TIMEOUTS.NAVIGATION);

  // Give additional time for all interactive elements to load
  await new Promise(resolve => setTimeout(resolve, TIMEOUTS.LONG));

  // Restore progress bar state if exists
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

  console.log(MESSAGES.SUCCESS.NAVIGATED_TO_ADVANCED);
}

/**
 * Navigate to Audience Retention report
 */
export async function navigateToAudienceRetention() {
  console.log('Navigating to Audience Retention...');

  // Click on Engagement tab
  const engagementTab = document.querySelector('tp-yt-paper-tab[id="interest_viewers"]');
  if (!engagementTab) {
    throw new Error('Engagement tab not found');
  }

  engagementTab.click();
  await new Promise(resolve => setTimeout(resolve, TIMEOUTS.MEDIUM));

  // Find and click Audience retention card
  const cards = document.querySelectorAll('ytcp-analytics-entity-card');
  for (const card of cards) {
    if (card.textContent.toLowerCase().includes('audience retention')) {
      const link = card.querySelector('a');
      if (link) {
        link.click();
        await waitForUrlChange('audience_retention', TIMEOUTS.NAVIGATION);
        await new Promise(resolve => setTimeout(resolve, TIMEOUTS.PAGE_LOAD));
        console.log('Navigated to Audience Retention');
        return;
      }
    }
  }

  throw new Error('Audience Retention card not found');
}

/**
 * Navigate back to metrics table from other reports
 */
export async function navigateBackToMetrics() {
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

  // Wait for tab switch to complete
  console.log('Waiting for tab to switch...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Wait for metrics table to load
  await waitForElement(SELECTORS.EXPLORE_TABLE, TIMEOUTS.NAVIGATION);

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
