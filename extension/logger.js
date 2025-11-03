/**
 * Logger Module for YouTube Treatment Comparison Helper
 * Centralized logging system for error tracking and debugging
 */

(function() {
  'use strict';

  // Storage keys
  const STORAGE_KEY = 'extension_logs';
  const MAX_LOGS = 500; // Keep last 500 log entries
  const MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB limit (Chrome allows ~5MB per extension)

  // Extension version (will be populated from manifest)
  let extensionVersion = '1.0.0';

  // Initialize extension version from manifest
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    try {
      const manifest = chrome.runtime.getManifest();
      extensionVersion = manifest.version;
    } catch (e) {
      console.warn('Could not read extension version:', e);
    }
  }

  // Log levels
  const LogLevel = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    USER_ACTION: 'USER_ACTION'
  };

  // Logger class
  class Logger {
    constructor() {
      this.sessionId = this.generateSessionId();
      this.startTime = Date.now();
      this.contextInvalid = false; // Track if extension context is invalid
    }

    generateSessionId() {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if extension context is valid
     */
    isContextValid() {
      if (this.contextInvalid) {
        return false; // Already know it's invalid
      }
      try {
        // Check if chrome.runtime is available and has an ID
        if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
          this.contextInvalid = true;
          return false;
        }
        return true;
      } catch (e) {
        this.contextInvalid = true;
        return false;
      }
    }

    /**
     * Create a log entry
     */
    createLogEntry(level, message, data = {}) {
      return {
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        level: level,
        message: message,
        data: data,
        version: extensionVersion,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
    }

    /**
     * Save log to Chrome storage
     */
    async saveLog(logEntry) {
      // Always log to console first
      this.consoleLog(logEntry);

      // Skip storage save if context is invalid
      if (!this.isContextValid()) {
        return; // Silently fail - context is invalidated, nothing we can do
      }

      try {
        // Get existing logs
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        let logs = result[STORAGE_KEY] || [];

        // Add new log
        logs.push(logEntry);

        // Trim logs if exceeding max count
        if (logs.length > MAX_LOGS) {
          logs = logs.slice(-MAX_LOGS);
        }

        // Check storage size
        const logsJson = JSON.stringify(logs);
        if (logsJson.length > MAX_STORAGE_SIZE) {
          // Remove oldest logs until under size limit
          while (logsJson.length > MAX_STORAGE_SIZE && logs.length > 10) {
            logs.shift();
          }
        }

        // Save to storage
        await chrome.storage.local.set({ [STORAGE_KEY]: logs });

      } catch (error) {
        // Check if this is a context invalidation error
        if (error.message && error.message.includes('Extension context invalidated')) {
          this.contextInvalid = true;
          // Silently fail - context is invalidated
        } else {
          // Other storage errors should still be logged
          console.error('Failed to save log to storage:', error);
        }
      }
    }

    /**
     * Output log to console with appropriate formatting
     */
    consoleLog(logEntry) {
      const prefix = `[${logEntry.level}] ${logEntry.timestamp}`;
      const message = `${prefix} - ${logEntry.message}`;

      switch (logEntry.level) {
        case LogLevel.ERROR:
          console.error(message, logEntry.data);
          break;
        case LogLevel.WARN:
          console.warn(message, logEntry.data);
          break;
        case LogLevel.DEBUG:
          console.debug(message, logEntry.data);
          break;
        default:
          console.log(message, logEntry.data);
      }
    }

    /**
     * Log an error
     */
    async logError(message, error = null, context = {}) {
      const data = {
        ...context,
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name
      };

      const logEntry = this.createLogEntry(LogLevel.ERROR, message, data);
      await this.saveLog(logEntry);
    }

    /**
     * Log a warning
     */
    async logWarning(message, context = {}) {
      const logEntry = this.createLogEntry(LogLevel.WARN, message, context);
      await this.saveLog(logEntry);
    }

    /**
     * Log an info message
     */
    async logInfo(message, context = {}) {
      const logEntry = this.createLogEntry(LogLevel.INFO, message, context);
      await this.saveLog(logEntry);
    }

    /**
     * Log a debug message
     */
    async logDebug(message, context = {}) {
      const logEntry = this.createLogEntry(LogLevel.DEBUG, message, context);
      await this.saveLog(logEntry);
    }

    /**
     * Log a user action
     */
    async logUserAction(action, details = {}) {
      const logEntry = this.createLogEntry(LogLevel.USER_ACTION, action, details);
      await this.saveLog(logEntry);
    }

    /**
     * Get all logs from storage
     */
    async getLogs() {
      try {
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        return result[STORAGE_KEY] || [];
      } catch (error) {
        console.error('Failed to retrieve logs:', error);
        return [];
      }
    }

    /**
     * Clear all logs from storage
     */
    async clearLogs() {
      try {
        await chrome.storage.local.remove([STORAGE_KEY]);
        console.log('Logs cleared successfully');
        return true;
      } catch (error) {
        console.error('Failed to clear logs:', error);
        return false;
      }
    }

    /**
     * Export logs as JSON
     */
    async exportLogs() {
      const logs = await this.getLogs();

      const exportData = {
        exportDate: new Date().toISOString(),
        sessionId: this.sessionId,
        extensionVersion: extensionVersion,
        totalLogs: logs.length,
        logs: logs
      };

      return exportData;
    }

    /**
     * Download logs as a JSON file
     */
    async downloadLogs() {
      try {
        const exportData = await this.exportLogs();
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const filename = `yt-treatment-helper-logs-${new Date().toISOString().replace(/:/g, '-')}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        await this.logInfo('Logs exported successfully', { filename });
        return true;
      } catch (error) {
        console.error('Failed to download logs:', error);
        await this.logError('Failed to export logs', error);
        return false;
      }
    }

    /**
     * Get log statistics
     */
    async getLogStats() {
      const logs = await this.getLogs();

      const stats = {
        total: logs.length,
        byLevel: {},
        sessionCount: new Set(logs.map(l => l.sessionId)).size,
        oldestLog: logs[0]?.timestamp,
        newestLog: logs[logs.length - 1]?.timestamp
      };

      // Count by level
      logs.forEach(log => {
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      });

      return stats;
    }
  }

  // Create global logger instance
  const logger = new Logger();

  // Expose logger globally
  if (typeof window !== 'undefined') {
    window.ExtensionLogger = logger;
  }

  // Auto-log page load
  logger.logInfo('Extension initialized', {
    page: window.location.pathname,
    isYouTubeStudio: window.location.hostname === 'studio.youtube.com'
  });

  // Intercept global errors
  window.addEventListener('error', (event) => {
    // Only log errors from our extension
    const isExtensionError = event.filename &&
      (event.filename.includes('content.js') ||
       event.filename.includes('popup.js') ||
       event.filename.includes('logger.js') ||
       event.filename.includes('chrome-extension://'));

    if (isExtensionError) {
      logger.logError('Uncaught error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message
      });
    }
  });

  // Intercept unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.logError('Unhandled promise rejection', event.reason, {
      promise: event.promise
    });
  });

  // Monitor for extension context invalidation
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    const contextCheckInterval = setInterval(() => {
      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          // Context is invalid - just log to console, don't try to save
          console.warn('[Extension context invalidated] The extension was reloaded. Logs will only appear in console.');
          logger.contextInvalid = true;
          // Stop checking once we know it's invalid
          clearInterval(contextCheckInterval);
        }
      } catch (e) {
        // Extension context is invalid
        logger.contextInvalid = true;
        clearInterval(contextCheckInterval);
      }
    }, 5000);
  }

})();
