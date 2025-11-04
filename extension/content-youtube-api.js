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
   * Navigation functions
   */
  isOnAnalyticsTab: function() {
    // Implementation will be migrated from content.js
    return false;
  },

  isOnAdvancedMode: function() {
    // Implementation will be migrated from content.js
    return false;
  },

  closeAdvancedMode: async function() {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  navigateToAnalyticsTab: async function() {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  navigateToAdvancedMode: async function() {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  navigateToAudienceRetention: async function() {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  navigateBackToMetrics: async function() {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
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
