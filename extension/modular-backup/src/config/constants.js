/**
 * Constants and configuration for the extension
 */

export const SELECTORS = {
  // Navigation
  ANALYTICS_TAB: 'a.menu-item-link',
  ANALYTICS_ICON: 'tp-yt-paper-icon-item.analytics',
  ADVANCED_BUTTON: '#advanced-analytics button',

  // Date picker
  DATE_TRIGGER: 'ytcp-dropdown-trigger',
  TIME_PICKER: 'yta-time-picker',
  LABEL_TEXT: '.label-text',
  DROPDOWN_TEXT: '.dropdown-trigger-text',
  DROPDOWN_MENU: 'tp-yt-paper-listbox[role="listbox"]',
  CUSTOM_OPTION: 'tp-yt-paper-item[test-id="fixed"]',
  DATE_DIALOG: 'ytcp-date-period-picker',

  // Metrics table
  EXPLORE_TABLE: 'yta-explore-table.data-container',
  METRICS_DROPDOWN: 'ytcp-chip-bar[id="metric-set"]',

  // UI elements
  PANEL: 'yt-treatment-helper',
  TOGGLE_BUTTON: 'treatment-helper-toggle',
};

export const TIMEOUTS = {
  SHORT: 300,
  MEDIUM: 800,
  LONG: 1500,
  DROPDOWN_WAIT: 1000,
  NAVIGATION: 10000,
  PAGE_LOAD: 2000,
};

export const METRICS = {
  VIEWS: 'EXTERNAL_VIEWS',
  AWT: 'AVERAGE_WATCH_TIME',
  CONSUMPTION: 'AVERAGE_WATCH_PERCENTAGE',
  CTR: 'VIDEO_THUMBNAIL_IMPRESSIONS_VTR',
};

export const URL_PATTERNS = {
  ANALYTICS: /\/video\/[^\/]+\/analytics\//,
  ADVANCED_MODE: /\/explore\?/,
};

export const DATE_FORMAT = {
  DISPLAY: 'DD/MM/YY',
  INTERNAL: 'YYYY-MM-DD',
  INPUT: 'DD/MM/YYYY',
};

export const YOUTUBE_DATA_DELAY_DAYS = 2;

export const MESSAGES = {
  ERRORS: {
    NO_ANALYTICS_LINK: 'Analytics navigation link not found. Please navigate to a video page first.',
    NO_ADVANCED_BUTTON: 'Advanced mode button not found. Please navigate to a video analytics page first.',
    NO_DROPDOWN: 'Date dropdown did not open',
    NO_CUSTOM_OPTION: 'Custom date option not found in dropdown. The page may not be fully loaded. Please refresh and try again.',
    NO_DATE_PICKER: 'No visible date picker found',
    DATE_VALIDATION_FAILED: 'Date validation failed',
    TREATMENT_BEFORE_PUBLISH: 'Treatment date cannot be before the video was published!',
    TREATMENT_TOO_RECENT: 'Treatment date must be at least 3 days ago to have enough data for analysis. YouTube data has a 2-day delay.',
    TREATMENT_FUTURE: 'Treatment date cannot be in the future. Please select a date at least 1 day ago.',
  },
  WARNINGS: {
    NO_PUBLISH_DATE: 'Could not detect video publish date. PRE period may extend before video was published.',
    PRE_BEFORE_PUBLISH: 'PRE period starts before video publish date!',
  },
  SUCCESS: {
    PUBLISH_DATE_FOUND: 'Found publish date from Analytics date selector',
    NAVIGATED_TO_ANALYTICS: 'Navigated to Analytics tab',
    NAVIGATED_TO_ADVANCED: 'Navigated to Advanced Mode',
  },
};
