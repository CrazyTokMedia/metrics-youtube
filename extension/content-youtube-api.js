/**
 * YouTube Treatment Comparison Helper - YouTube Studio API Module
 * Functions for interacting with YouTube Studio DOM and analytics
 */

// Namespace already created by content-utils.js
YTTreatmentHelper.API = {
  /**
   * Get video publish date from YouTube Studio
   */
  getVideoPublishDate: function() {
    const formatDate = YTTreatmentHelper.Utils.formatDate;

    // Try multiple methods to find the publish date

    // Method 1 (BEST): Extract from Analytics page date selector
    const dateSelectors = document.querySelectorAll('ytcp-dropdown-trigger');
    for (const selector of dateSelectors) {
      const triggerText = selector.querySelector('.dropdown-trigger-text');
      const labelText = selector.querySelector('.label-text');

      if (triggerText && labelText) {
        const triggerContent = triggerText.textContent.trim();
        const labelContent = labelText.textContent.trim();

        if (triggerContent.toLowerCase().includes('since published') ||
            triggerContent.toLowerCase().includes('published')) {
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

    // Method 2: Check yta-time-picker
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

    // Method 3: Check ytInitialData
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

    // Method 4: Look for publish date in metadata
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
  },

  /**
   * Calculate PRE/POST date ranges for treatment comparison
   */
  calculateDateRanges: function(treatmentDate, videoPublishDate = null) {
    const formatDate = YTTreatmentHelper.Utils.formatDate;

    const treatment = new Date(treatmentDate);
    const today = new Date();

    // YouTube Analytics only has data up to 2 days ago
    const maxYouTubeDate = new Date(today);
    maxYouTubeDate.setDate(maxYouTubeDate.getDate() - 2);
    const yesterday = maxYouTubeDate;

    yesterday.setHours(0, 0, 0, 0);
    treatment.setHours(0, 0, 0, 0);

    const daysSince = Math.floor((yesterday - treatment) / (1000 * 60 * 60 * 24));

    if (daysSince < 0) {
      throw new Error('Treatment date cannot be in the future. Please select a date at least 1 day ago.');
    }

    if (daysSince < 2) {
      throw new Error('Treatment date must be at least 3 days ago to have enough data for analysis. YouTube data has a 2-day delay.');
    }

    const maxPostDays = daysSince + 1;
    let maxPreDays;
    let publishDate;

    if (videoPublishDate) {
      publishDate = new Date(videoPublishDate);
      publishDate.setHours(0, 0, 0, 0);

      const daysBetween = Math.floor((treatment - publishDate) / (1000 * 60 * 60 * 24));
      maxPreDays = daysBetween;

      console.log(`   Available PRE days: ${maxPreDays} (from ${formatDate(publishDate)} to day before treatment)`);
      console.log(`   Available POST days: ${maxPostDays} (from treatment to ${formatDate(yesterday)})`);
    } else {
      maxPreDays = maxPostDays;
      console.warn(`   No publish date - assuming equal periods are available`);
    }

    const periodLength = Math.min(maxPreDays, maxPostDays);

    console.log(`   Using period length: ${periodLength} days (shorter of PRE: ${maxPreDays}, POST: ${maxPostDays})`);

    // PRE period
    const preEnd = new Date(treatment);
    preEnd.setDate(preEnd.getDate() - 1);
    const preStart = new Date(preEnd);
    preStart.setDate(preStart.getDate() - periodLength + 1);
    const preDays = periodLength;

    // POST period
    const postStart = new Date(treatment);
    const postEnd = new Date(postStart);
    postEnd.setDate(postEnd.getDate() + periodLength - 1);
    const postDays = periodLength;

    // Validate
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
  },

  /**
   * Set custom date range in YouTube Studio
   */
  setCustomDateRange: async function(startDate, endDate, overrideFormat = null) {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  /**
   * Set custom date range with retry on failure
   */
  setCustomDateRangeWithRetry: async function(startDate, endDate) {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  /**
   * Select metrics to display in YouTube Studio
   */
  selectMetrics: async function() {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  /**
   * Extract metric values from the table
   */
  extractValues: async function() {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  /**
   * Extract retention metric from audience retention tab
   */
  extractRetentionMetric: async function() {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  /**
   * Navigation functions - State checks
   */
  isOnAnalyticsTab: function() {
    // Check URL pattern - Analytics tab URLs contain /analytics/
    const urlPattern = /\/video\/[^\/]+\/analytics\//;
    return urlPattern.test(window.location.href);
  },

  isOnAdvancedMode: function() {
    return window.location.href.includes('/explore?');
  },

  closeAdvancedMode: async function() {
    const waitForUrlChange = YTTreatmentHelper.Utils.waitForUrlChange;

    console.log('Closing Advanced Mode...');

    if (window.ExtensionLogger) {
      window.ExtensionLogger.logInfo('Closing Advanced Mode to fetch publish date');
    }

    const closeButton = document.querySelector('yta-explore-page #close-button');

    if (!closeButton) {
      console.warn('Close button not found in Advanced Mode');
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logWarning('Close button not found in Advanced Mode');
      }
      return false;
    }

    closeButton.click();

    try {
      await waitForUrlChange('/analytics/tab-', 5000);
    } catch (error) {
      console.error('Timeout waiting for Advanced Mode to close');
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logError('Timeout closing Advanced Mode', error);
      }
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Closed Advanced Mode, back to regular Analytics');
    if (window.ExtensionLogger) {
      window.ExtensionLogger.logInfo('Successfully closed Advanced Mode');
    }
    return true;
  },

  navigateToAnalyticsTab: async function() {
    const waitForUrlChange = YTTreatmentHelper.Utils.waitForUrlChange;
    const isOnAdvancedMode = this.isOnAdvancedMode;
    const isOnAnalyticsTab = this.isOnAnalyticsTab;
    const closeAdvancedMode = this.closeAdvancedMode;

    console.log('Checking if on Analytics tab...');

    if (isOnAdvancedMode()) {
      console.log('Currently on Advanced Mode, closing it first...');
      const closed = await closeAdvancedMode();
      if (closed) {
        console.log('Advanced Mode closed, now on regular Analytics');
        return;
      }
    }

    if (isOnAnalyticsTab()) {
      console.log('Already on Analytics tab');
      return;
    }

    console.log('Not on Analytics tab, navigating there...');

    const navLinks = Array.from(document.querySelectorAll('a.menu-item-link'));
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

    analyticsLink.click();
    await waitForUrlChange('/analytics/', 10000);
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Navigated to Analytics tab');
  },

  navigateToAdvancedMode: async function() {
    const waitForElement = YTTreatmentHelper.Utils.waitForElement;
    const waitForUrlChange = YTTreatmentHelper.Utils.waitForUrlChange;
    const navigateToAnalyticsTab = this.navigateToAnalyticsTab;

    console.log('Navigating to Advanced Mode...');

    await navigateToAnalyticsTab();

    const advancedButton = document.querySelector('#advanced-analytics button');

    if (!advancedButton) {
      throw new Error('Advanced mode button not found. Please navigate to a video analytics page first.');
    }

    advancedButton.click();
    await waitForUrlChange('/explore?', 10000);
    await waitForElement('yta-explore-table.data-container', 10000);
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
  },

  navigateToAudienceRetention: async function() {
    const waitForElement = YTTreatmentHelper.Utils.waitForElement;

    console.log('Navigating to Audience Retention...');

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

    console.log('Waiting for tab to switch...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ensure progress bar state persists
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

    await waitForElement('yta-line-chart-base svg', 10000);

    console.log('Navigated to Audience Retention');
  },

  navigateBackToMetrics: async function() {
    const waitForElement = YTTreatmentHelper.Utils.waitForElement;

    console.log('Navigating back to metrics table...');

    // Close any open dialogs
    const openDialogs = document.querySelectorAll('tp-yt-paper-dialog[role="dialog"]');
    for (const dialog of openDialogs) {
      if (dialog.offsetParent !== null) {
        const closeBtn = dialog.querySelector('button[aria-label*="lose"], button[aria-label*="ancel"]');
        if (closeBtn) {
          closeBtn.click();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
        if (backdrop && backdrop.offsetParent !== null) {
          backdrop.click();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

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

    const existingMenu = reportDropdown.querySelector('tp-yt-paper-listbox[role="menu"]');
    if (existingMenu && existingMenu.offsetParent !== null) {
      console.log('Report dropdown already open, closing first...');
      reportDropdown.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    reportDropdown.click();
    console.log('Clicked Report dropdown, waiting for menu...');

    await new Promise(resolve => setTimeout(resolve, 800));

    let reportMenu = null;

    reportMenu = reportDropdown.querySelector('tp-yt-paper-listbox[role="menu"]');
    if (reportMenu && reportMenu.offsetParent !== null) {
      console.log('Found report menu inside dropdown trigger');
    } else {
      reportMenu = null;
    }

    if (!reportMenu) {
      const allListboxes = document.querySelectorAll('tp-yt-paper-listbox[role="menu"]');
      console.log(`Found ${allListboxes.length} listboxes with role="menu"`);

      for (const listbox of allListboxes) {
        if (listbox.offsetParent !== null) {
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
      throw new Error('Report menu not found after trying all strategies');
    }

    const menuItems = Array.from(reportMenu.querySelectorAll('tp-yt-paper-item'));
    console.log(`Found ${menuItems.length} items in report menu`);

    let topContentOption = null;

    for (const item of menuItems) {
      const text = item.textContent.trim();
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

    console.log('Waiting for tab to switch...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await waitForElement('yta-explore-table.data-container', 10000);

    // Ensure progress bar state persists
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
  },

  /**
   * Main extraction orchestration
   */
  extractPrePostMetrics: async function(preStart, preEnd, postStart, postEnd, statusCallback, includeRetention = false) {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  }
};

console.log('YouTube API module loaded');
