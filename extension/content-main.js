/**
 * YouTube Treatment Comparison Helper - Main Orchestration
 * Initializes appropriate modules based on current page
 */

// ============================================================
// GLOBAL ERROR HANDLING & CLEANUP
// ============================================================

// Global error handler for the extension
window.addEventListener('error', (event) => {
  // Only handle errors from our extension code
  const isExtensionError = event.filename &&
    (event.filename.includes('content') || event.filename.includes('chrome-extension://'));

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
        extractBtn.innerHTML = '<span class="btn-icon">⚠️</span> Error - Click to Retry';

        // Restore original text after 5 seconds
        setTimeout(() => {
          extractBtn.innerHTML = '<span class="btn-icon">📊</span> Extract Metrics';
        }, 5000);
      }
    } catch (e) {
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

// Listen for extension disable/unload
if (chrome.runtime && chrome.runtime.onSuspend) {
  chrome.runtime.onSuspend.addListener(cleanup);
}

// ============================================================
// INITIALIZATION
// ============================================================

function init() {
  console.log('YouTube Treatment Comparison Helper loaded');
  console.log('Namespace available:', !!window.YTTreatmentHelper);

  // Verify all modules loaded
  if (!window.YTTreatmentHelper) {
    console.error('❌ Namespace not found! Modules failed to load.');
    return;
  }

  console.log('Available modules:', Object.keys(window.YTTreatmentHelper));

  // Only run on YouTube Studio
  if (window.location.hostname === 'studio.youtube.com') {
    // Initialize appropriate mode based on page type
    if (YTTreatmentHelper.Utils.isVideoAnalyticsPage()) {
      console.log('Initializing Single Video mode...');
      YTTreatmentHelper.SingleVideo.init();
    } else if (YTTreatmentHelper.Utils.isAnalyticsHomePage()) {
      console.log('Initializing Batch mode...');
      YTTreatmentHelper.BatchMode.init();
    } else {
      console.log('Page type not recognized for extension functionality');
    }
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
      if (YTTreatmentHelper && YTTreatmentHelper.SingleVideo) {
        YTTreatmentHelper.SingleVideo.createHelperPanel();
      }
    }
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});
