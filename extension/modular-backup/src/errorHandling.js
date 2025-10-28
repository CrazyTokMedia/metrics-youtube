/**
 * Global error handling and cleanup
 */

import { SELECTORS } from './config/constants.js';

// Suppress YouTube Studio's console spam
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

// Global error handler
window.addEventListener('error', (event) => {
  const isExtensionError = event.filename &&
    (event.filename.includes('content.js') || event.filename.includes('chrome-extension://'));

  if (isExtensionError) {
    console.error('🔴 Extension error caught:', event.error?.message || event.message);
    console.error('Stack:', event.error?.stack);

    try {
      const extractBtn = document.getElementById('auto-extract-btn');
      if (extractBtn && extractBtn.disabled) {
        extractBtn.disabled = false;
        extractBtn.classList.remove('disabled');
        extractBtn.innerHTML = '<span class="btn-icon">⚠️</span> Error - Click to Retry';

        setTimeout(() => {
          extractBtn.innerHTML = '<span class="btn-icon">📊</span> Extract Metrics';
        }, 5000);
      }
    } catch (e) {
      console.error('Could not update UI after error:', e);
    }

    event.preventDefault();
  }
});

// Cleanup function
export const cleanup = () => {
  console.log('🧹 Cleaning up extension...');

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

  const panel = document.getElementById(SELECTORS.PANEL);
  if (panel) panel.remove();

  const toggle = document.querySelector(`.${SELECTORS.TOGGLE_BUTTON}`);
  if (toggle) toggle.remove();

  console.log('✅ Cleanup complete');
};

// Listen for extension unload
if (chrome.runtime && chrome.runtime.onSuspend) {
  chrome.runtime.onSuspend.addListener(cleanup);
}

// Check if extension context is still valid
export function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}
