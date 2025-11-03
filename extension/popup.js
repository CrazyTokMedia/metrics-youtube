/**
 * YouTube Treatment Comparison Helper - Popup Script
 * Handles toggle button for showing/hiding the panel on YouTube Studio
 */

document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtn = document.getElementById('toggle-panel-btn');
  const toggleText = document.getElementById('toggle-text');
  const exportLogsBtn = document.getElementById('export-logs-btn');

  // Log popup opened
  if (window.ExtensionLogger) {
    window.ExtensionLogger.logUserAction('Popup opened');
  }

  // Get current panel state from storage
  const result = await chrome.storage.local.get(['panelVisible']);
  let isPanelVisible = result.panelVisible !== false; // Default to true

  // Update button state
  updateButton(isPanelVisible);

  // Handle toggle button click
  toggleBtn.addEventListener('click', async () => {
    // Toggle state
    isPanelVisible = !isPanelVisible;

    // Log user action
    if (window.ExtensionLogger) {
      window.ExtensionLogger.logUserAction('Panel toggled', {
        newState: isPanelVisible ? 'visible' : 'hidden'
      });
    }

    // Save to storage
    await chrome.storage.local.set({ panelVisible: isPanelVisible });

    // Update button
    updateButton(isPanelVisible);

    // Send message to content script to toggle panel
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && tab.url.includes('studio.youtube.com')) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'togglePanel',
        visible: isPanelVisible
      });

      // Auto-close popup when showing the panel
      if (isPanelVisible) {
        window.close();
      }
    } else {
      // Not on YouTube Studio
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logWarning('User tried to toggle panel outside YouTube Studio', {
          currentUrl: tab?.url
        });
      }
      alert('Please navigate to YouTube Studio first');
    }
  });

  // Handle export logs button click
  exportLogsBtn.addEventListener('click', async () => {
    try {
      if (window.ExtensionLogger) {
        window.ExtensionLogger.logUserAction('Export logs button clicked');

        const success = await window.ExtensionLogger.downloadLogs();

        if (success) {
          // Show success feedback
          exportLogsBtn.textContent = 'Downloaded!';
          exportLogsBtn.classList.add('success');

          setTimeout(() => {
            exportLogsBtn.textContent = 'Download Debug Logs';
            exportLogsBtn.classList.remove('success');
          }, 2000);
        } else {
          alert('Failed to download logs. Please try again.');
        }
      } else {
        alert('Logger not available. Please reload the extension.');
      }
    } catch (error) {
      console.error('Error downloading logs:', error);
      alert('Error downloading logs: ' + error.message);
    }
  });

  function updateButton(visible) {
    if (visible) {
      toggleBtn.classList.remove('hide');
      toggleText.textContent = 'Hide Panel';
    } else {
      toggleBtn.classList.add('hide');
      toggleText.textContent = 'Show Panel';
    }
  }

  // Set version dynamically from manifest
  const versionInfo = document.getElementById('version-info');
  if (versionInfo) {
    const manifest = chrome.runtime.getManifest();
    versionInfo.textContent = `Version ${manifest.version}`;
  }
});
