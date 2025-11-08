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
  // IMPORTANT: Uses UTC methods to match UTC-based date calculations
  // This prevents timezone shifts for users in different timezones
  formatDate: function(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
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

// ============================================================
// EXTRACTION HISTORY MANAGEMENT
// ============================================================

YTTreatmentHelper.ExtractionHistory = {
  // Constants
  MAX_SINGLE_HISTORY: 50,  // Keep last 50 extractions (audit trail)
  MAX_BATCH_HISTORY: 10,

  /**
   * Save a single video extraction to history
   */
  saveSingleExtraction: async function(extractionData) {
    try {
      const videoId = extractionData.videoId || YTTreatmentHelper.Utils.getVideoIdFromUrl();
      if (!videoId) {
        console.warn('Cannot save extraction: no video ID');
        return;
      }

      const historyEntry = {
        id: Date.now(),
        videoId: videoId,
        videoTitle: extractionData.videoTitle || 'Unknown Title',
        treatmentDate: extractionData.treatmentDate,
        extractionDate: new Date().toISOString(),
        mode: extractionData.mode || 'equal-periods',
        dateRanges: extractionData.dateRanges,
        metrics: extractionData.metrics,
        durationMs: extractionData.durationMs || 0  // Time taken for extraction
      };

      // Load existing history
      const result = await safeStorage.get(['extractionHistory']);
      const history = result.extractionHistory || { single: [], batch: [] };

      // Ensure single is an array (backward compatibility)
      if (!Array.isArray(history.single)) {
        history.single = [];
      }

      // Add new entry at the beginning (most recent first)
      history.single.unshift(historyEntry);

      // Keep only latest MAX entries
      if (history.single.length > this.MAX_SINGLE_HISTORY) {
        history.single = history.single.slice(0, this.MAX_SINGLE_HISTORY);
      }

      // Save back to storage
      await safeStorage.set({ extractionHistory: history });
      console.log(`Saved extraction to history (${videoId})`);

      return historyEntry.id;
    } catch (error) {
      console.error('Error saving extraction to history:', error);
    }
  },

  /**
   * Save a batch extraction to history
   */
  saveBatchExtraction: async function(batchData) {
    try {
      const historyEntry = {
        id: Date.now(),
        extractionDate: new Date().toISOString(),
        treatmentDate: batchData.treatmentDate,
        mode: batchData.mode,
        videoCount: batchData.results.length,
        results: batchData.results,
        durationMs: batchData.durationMs || 0,  // Actual extraction time
        estimatedManualTimeMs: batchData.estimatedManualTimeMs || 0,  // Estimated manual time
        timeSavedMs: batchData.timeSavedMs || 0  // Time saved by automation
      };

      // Load existing history
      const result = await safeStorage.get(['extractionHistory']);
      const history = result.extractionHistory || { single: {}, batch: [] };

      // Add new entry at the beginning
      history.batch.unshift(historyEntry);

      // Keep only latest MAX entries
      if (history.batch.length > this.MAX_BATCH_HISTORY) {
        history.batch = history.batch.slice(0, this.MAX_BATCH_HISTORY);
      }

      // Save back to storage
      await safeStorage.set({ extractionHistory: history });
      console.log(`Saved batch extraction to history (${batchData.results.length} videos)`);

      return historyEntry.id;
    } catch (error) {
      console.error('Error saving batch extraction to history:', error);
    }
  },

  /**
   * Get all extraction history (audit trail)
   */
  getSingleHistory: async function() {
    try {
      const result = await safeStorage.get(['extractionHistory']);
      const history = result.extractionHistory || { single: [], batch: [] };

      // Handle backward compatibility - convert old object format to array
      if (!Array.isArray(history.single)) {
        const allExtractions = [];
        for (const videoId in history.single) {
          allExtractions.push(...history.single[videoId]);
        }
        // Sort by extraction date (most recent first)
        allExtractions.sort((a, b) => new Date(b.extractionDate) - new Date(a.extractionDate));
        return allExtractions;
      }

      return history.single || [];
    } catch (error) {
      console.error('Error loading extraction history:', error);
      return [];
    }
  },

  /**
   * Get batch extraction history
   */
  getBatchHistory: async function() {
    try {
      const result = await safeStorage.get(['extractionHistory']);
      const history = result.extractionHistory || { single: {}, batch: [] };

      return history.batch || [];
    } catch (error) {
      console.error('Error loading batch history:', error);
      return [];
    }
  },

  /**
   * Clear all history
   */
  clearHistory: async function(options = {}) {
    try {
      const result = await safeStorage.get(['extractionHistory']);
      const history = result.extractionHistory || { single: [], batch: [] };

      if (options.type === 'single') {
        // Clear all single video history
        history.single = [];
      } else if (options.type === 'batch') {
        // Clear all batch history
        history.batch = [];
      } else {
        // Clear everything
        history.single = [];
        history.batch = [];
      }

      await safeStorage.set({ extractionHistory: history });
      console.log('History cleared:', options);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },

  /**
   * Get history entry by ID
   */
  getEntryById: async function(entryId, type = 'single') {
    try {
      const result = await safeStorage.get(['extractionHistory']);
      const history = result.extractionHistory || { single: [], batch: [] };

      if (type === 'single') {
        // Search through single extractions array
        if (Array.isArray(history.single)) {
          return history.single.find(e => e.id === entryId);
        }
      } else {
        // Search batch history
        return history.batch.find(e => e.id === entryId);
      }

      return null;
    } catch (error) {
      console.error('Error getting history entry:', error);
      return null;
    }
  },

  /**
   * Format extraction date for display
   */
  formatExtractionDate: function(isoDateString) {
    try {
      const date = new Date(isoDateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      // Show actual date for older extractions
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown';
    }
  },

  /**
   * Parse maximum date from YouTube validation error message
   * Error format: "Enter 06/11/2025 or earlier" (MM/DD/YYYY format)
   * Returns date in YYYY-MM-DD format, or null if not found
   */
  parseMaxDateFromError: function(errorMessage) {
    if (!errorMessage) return null;

    const maxDateMatch = errorMessage.match(/Enter (\d{1,2})\/(\d{1,2})\/(\d{4}) or earlier/i);
    if (maxDateMatch) {
      const month = maxDateMatch[1].padStart(2, '0');
      const day = maxDateMatch[2].padStart(2, '0');
      const year = maxDateMatch[3];

      console.log(`Parsed max date from error: ${month}/${day}/${year} (MM/DD/YYYY)`);

      return `${year}-${month}-${day}`;
    }

    return null;
  }
};

console.log('Utils module loaded');
