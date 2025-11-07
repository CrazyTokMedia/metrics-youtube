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

  // Handle history button click
  const historyBtn = document.getElementById('history-btn');
  const historySection = document.getElementById('history-section');
  const historyList = document.getElementById('history-list');

  historyBtn.addEventListener('click', async () => {
    // Log user action
    if (window.ExtensionLogger) {
      window.ExtensionLogger.logUserAction('History button clicked from popup');
    }

    // Toggle history visibility
    if (historySection.style.display === 'none') {
      // Load and show history
      await loadHistory();
      historySection.style.display = 'block';
      historyBtn.textContent = '📜 Hide History';
    } else {
      // Hide history
      historySection.style.display = 'none';
      historyBtn.textContent = '📜 View History';
    }
  });

  // Load and display history
  async function loadHistory() {
    try {
      // Get history from storage
      const result = await chrome.storage.local.get(['extractionHistory']);
      const history = result.extractionHistory || { single: [], batch: [] };

      // Handle backward compatibility - convert old object format to array
      let singleHistory = [];
      if (Array.isArray(history.single)) {
        singleHistory = history.single;
      } else {
        // Convert old format
        for (const videoId in history.single) {
          singleHistory.push(...history.single[videoId]);
        }
        singleHistory.sort((a, b) => new Date(b.extractionDate) - new Date(a.extractionDate));
      }

      if (singleHistory.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No extraction history</div>';
        return;
      }

      // Build history HTML
      let html = '';
      singleHistory.forEach((entry, index) => {
        const modeLabel = entry.mode === 'equal-periods' ? 'Equal Periods' :
                          entry.mode === 'lifetime' ? 'Lifetime' : 'Complete';

        const date = formatExtractionDate(entry.extractionDate);

        html += `
          <div class="history-item">
            <div class="history-item-header">
              <span class="history-item-date">${date}</span>
              <span class="history-item-mode">${modeLabel}</span>
            </div>
            <div class="history-video-title">${entry.videoTitle || 'Unknown Video'}</div>
            <div class="history-video-id">${entry.videoId}</div>
            <div class="history-treatment-date">Treatment: ${entry.treatmentDate}</div>
            <button class="history-copy-btn" data-entry-index="${index}">📋 Copy Data</button>
          </div>
        `;
      });

      historyList.innerHTML = html;

      // Add copy button event listeners
      const copyButtons = historyList.querySelectorAll('.history-copy-btn');
      copyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
          const entryIndex = parseInt(btn.dataset.entryIndex);
          const entry = singleHistory[entryIndex];
          await copyHistoryEntry(entry, btn);
        });
      });
    } catch (error) {
      console.error('Error loading history:', error);
      historyList.innerHTML = '<div class="history-empty">Error loading history</div>';
    }
  }

  // Copy history entry data to clipboard
  async function copyHistoryEntry(entry, button) {
    try {
      console.log('Copy button clicked for entry:', entry);
      let exportData = '';

      // entry.metrics has structure: { pre: {...}, post: {...}, periods: {...} }
      const metrics = entry.metrics;

      if (!metrics || !metrics.pre || !metrics.post) {
        console.error('Invalid metrics structure:', metrics);
        button.textContent = '✗ No Data';
        setTimeout(() => {
          button.textContent = '📋 Copy Data';
        }, 2000);
        return;
      }

      // For now, all extractions follow equal-periods format
      // Format: Treatment Date | Pre Impressions | Post Impressions | empty | Pre CTR | Post CTR | empty | Pre AWT | Post AWT | Pre Retention | Post Retention
      const preRange = entry.dateRanges.pre;
      const postRange = entry.dateRanges.post;
      const treatmentDate = `Pre - ${formatDateForExport(preRange.start)}-${formatDateForExport(preRange.end)} Post- ${formatDateForExport(postRange.start)}-${formatDateForExport(postRange.end)}`;

      exportData = [
        treatmentDate,
        metrics.pre.impressions || '',
        metrics.post.impressions || '',
        '', // Empty for Change column
        metrics.pre.ctr || '',
        metrics.post.ctr || '',
        '', // Empty for Change column
        metrics.pre.awt || '',
        metrics.post.awt || '',
        metrics.pre.retention || '',
        metrics.post.retention || ''
      ].join('\t');

      console.log('Export data:', exportData);

      // Copy to clipboard
      await navigator.clipboard.writeText(exportData);

      // Show success feedback
      button.textContent = '✓ Copied!';
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = '📋 Copy Data';
        button.classList.remove('copied');
      }, 2000);
    } catch (error) {
      console.error('Error copying data:', error);
      button.textContent = '✗ Error';
      setTimeout(() => {
        button.textContent = '📋 Copy Data';
      }, 2000);
    }
  }

  // Format date for export (DD.MM.YYYY)
  function formatDateForExport(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }

  // Format extraction date for display
  function formatExtractionDate(isoDateString) {
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
  }

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
