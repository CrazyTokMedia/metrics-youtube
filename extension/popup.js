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

  // Helper: Format duration from milliseconds to readable string
  function formatDuration(ms) {
    if (!ms || ms <= 0) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

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

      // Get batch history
      let batchHistory = Array.isArray(history.batch) ? history.batch : [];

      // Combine and sort by extraction date
      const allHistory = [
        ...singleHistory.map(e => ({ ...e, type: 'single' })),
        ...batchHistory.map(e => ({ ...e, type: 'batch' }))
      ].sort((a, b) => new Date(b.extractionDate) - new Date(a.extractionDate));

      if (allHistory.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No extraction history</div>';
        return;
      }

      // Build history HTML with accordion structure
      let html = '';
      allHistory.forEach((entry, index) => {
        const date = formatExtractionDate(entry.extractionDate);

        if (entry.type === 'single') {
          // Single video entry
          const modeLabel = entry.mode === 'equal-periods' ? 'Equal Periods' :
                            entry.mode === 'lifetime' ? 'Lifetime' : 'Complete';

          // Format extraction time
          const duration = formatDuration(entry.durationMs);
          const durationText = duration ? ` • ${duration}` : '';

          // Format date ranges if available
          let dateRangesHtml = '';
          if (entry.dateRanges && entry.dateRanges.pre && entry.dateRanges.post) {
            const preRange = `${formatDateForExport(entry.dateRanges.pre.start)}-${formatDateForExport(entry.dateRanges.pre.end)}`;
            const postRange = `${formatDateForExport(entry.dateRanges.post.start)}-${formatDateForExport(entry.dateRanges.post.end)}`;
            dateRangesHtml = `
              <div class="history-detail-row">
                <span class="history-detail-label">Pre Period:</span>
                <span>${preRange}</span>
              </div>
              <div class="history-detail-row">
                <span class="history-detail-label">Post Period:</span>
                <span>${postRange}</span>
              </div>
            `;
          }

          html += `
            <div class="history-item" data-entry-index="${index}">
              <div class="history-item-header">
                <div class="history-header-clickable">
                  <span class="history-chevron">▶</span>
                  <div class="history-header-content">
                    <div class="history-type-label">Single Extraction</div>
                    <div class="history-video-title">${entry.videoTitle || 'Unknown Video'}</div>
                    <div class="history-header-meta">
                      <span class="history-item-date">${date}</span>
                      <span class="history-meta-separator">•</span>
                      <span class="history-item-mode">${modeLabel}</span>
                    </div>
                  </div>
                </div>
                <button class="history-header-copy-btn" data-entry-index="${index}" data-entry-type="single">📋 Copy</button>
              </div>
              <div class="history-item-details">
                <div class="history-detail-row">
                  <span class="history-detail-label">Treatment:</span>
                  <span class="history-treatment-date">${entry.treatmentDate}${durationText}</span>
                </div>
                <div class="history-detail-row">
                  <span class="history-detail-label">Video ID:</span>
                  <span class="history-video-id">${entry.videoId}</span>
                </div>
                ${dateRangesHtml}
              </div>
            </div>
          `;
        } else {
          // Batch entry
          const modeLabel = entry.mode === 'equal-periods' ? 'Equal Periods' :
                            entry.mode === 'lifetime' ? 'Lifetime' : 'Complete';
          const videoCount = entry.results ? entry.results.length : 0;

          // Format extraction time and time saved
          const duration = formatDuration(entry.durationMs);
          const timeSaved = formatDuration(entry.timeSavedMs);
          let durationText = '';
          if (duration) {
            durationText = ` • ${duration}`;
            if (timeSaved) {
              durationText += ` (Saved ${timeSaved})`;
            }
          }

          // Helper: Truncate title to ~15 chars at word boundary
          const truncateTitle = (title, maxLength = 15) => {
            if (!title || title.length <= maxLength) return title;
            const truncated = title.substring(0, maxLength);
            const lastSpace = truncated.lastIndexOf(' ');
            return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
          };

          // Create batch title preview with character-limited titles from first 3 videos
          let batchTitlePreview = `Batch Extraction (${videoCount} videos)`;
          if (entry.results && entry.results.length > 0) {
            const previews = entry.results.slice(0, 3).map(result => {
              return truncateTitle(result.videoTitle || 'Unknown', 15);
            });
            batchTitlePreview = previews.join(', ');
          }

          // Format date ranges if available
          let dateRangesHtml = '';
          if (entry.dateRanges && entry.dateRanges.pre && entry.dateRanges.post) {
            const preRange = `${formatDateForExport(entry.dateRanges.pre.start)}-${formatDateForExport(entry.dateRanges.pre.end)}`;
            const postRange = `${formatDateForExport(entry.dateRanges.post.start)}-${formatDateForExport(entry.dateRanges.post.end)}`;
            dateRangesHtml = `
              <div class="history-detail-row">
                <span class="history-detail-label">Pre Period:</span>
                <span>${preRange}</span>
              </div>
              <div class="history-detail-row">
                <span class="history-detail-label">Post Period:</span>
                <span>${postRange}</span>
              </div>
            `;
          }

          // Build list of all video titles for accordion with copy buttons
          let videoTitlesHtml = '';
          if (entry.results && entry.results.length > 0) {
            const titlesList = entry.results.map((result, videoIndex) => {
              const videoTitle = result.videoTitle || 'Unknown Video';
              return `
                <div class="batch-video-item">
                  <span class="batch-video-title">${videoTitle}</span>
                  <button class="batch-video-copy-btn"
                          data-entry-index="${index}"
                          data-video-index="${videoIndex}"
                          title="Copy this video's data">📋</button>
                </div>`;
            }).join('');
            videoTitlesHtml = `
              <div class="history-detail-row">
                <span class="history-detail-label">All Videos:</span>
              </div>
              <div class="batch-video-list">
                ${titlesList}
              </div>
            `;
          }

          // Format metadata line (treatment date + duration)
          let metadataLine = entry.treatmentDate;
          if (duration) {
            metadataLine += ` • ${duration}`;
            if (timeSaved) {
              metadataLine += ` (Saved ${timeSaved})`;
            }
          }

          html += `
            <div class="history-item" data-entry-index="${index}">
              <div class="history-item-header">
                <div class="history-header-clickable">
                  <span class="history-chevron">▶</span>
                  <div class="history-header-content">
                    <div class="history-type-label">Batch Extraction</div>
                    <div class="history-video-title">${batchTitlePreview}</div>
                    <div class="history-header-meta">
                      <span class="history-item-date">${date}</span>
                      <span class="history-meta-separator">•</span>
                      <span class="history-item-mode">${modeLabel}</span>
                    </div>
                    <div class="history-metadata-line">${metadataLine}</div>
                    <div class="history-click-hint">Click to see all titles</div>
                  </div>
                </div>
                <button class="history-header-copy-btn" data-entry-index="${index}" data-entry-type="batch">📋 Copy</button>
              </div>
              <div class="history-item-details">
                <div class="history-detail-row">
                  <span class="history-detail-label">Treatment:</span>
                  <span class="history-treatment-date">${entry.treatmentDate}${durationText}</span>
                </div>
                <div class="history-detail-row">
                  <span class="history-detail-label">Videos:</span>
                  <span>${videoCount} extracted</span>
                </div>
                ${dateRangesHtml}
                ${videoTitlesHtml}
              </div>
            </div>
          `;
        }
      });

      historyList.innerHTML = html;

      // Add accordion toggle event listeners to the clickable area only
      const historyItems = historyList.querySelectorAll('.history-item');
      historyItems.forEach(item => {
        const clickableArea = item.querySelector('.history-header-clickable');
        clickableArea.addEventListener('click', () => {
          // Toggle expanded class
          item.classList.toggle('expanded');
        });
      });

      // Add copy button event listeners (now in header)
      const copyButtons = historyList.querySelectorAll('.history-header-copy-btn');
      copyButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          // Prevent accordion toggle when clicking copy button
          e.stopPropagation();

          const entryIndex = parseInt(btn.dataset.entryIndex);
          const entryType = btn.dataset.entryType;
          const entry = allHistory[entryIndex];

          if (entryType === 'batch') {
            await copyBatchHistoryEntry(entry, btn);
          } else {
            await copyHistoryEntry(entry, btn);
          }
        });
      });

      // Add event listeners for individual video copy buttons in batch accordion
      const videoCopyButtons = historyList.querySelectorAll('.batch-video-copy-btn');
      videoCopyButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation(); // Prevent accordion toggle

          const entryIndex = parseInt(btn.dataset.entryIndex);
          const videoIndex = parseInt(btn.dataset.videoIndex);
          const entry = allHistory[entryIndex];

          if (entry && entry.results && entry.results[videoIndex]) {
            await copySingleVideoFromBatch(entry.results[videoIndex], btn);
          }
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
        button.textContent = '✗ Empty';
        button.classList.add('error');
        setTimeout(() => {
          button.textContent = '📋 Copy';
          button.classList.remove('error');
        }, 2000);
        return;
      }

      // Format: Treatment Date | Pre Period | Post Period | Pre Impressions | Post Impressions | empty | Pre CTR | Post CTR | empty | Pre Views | Post Views | empty | Pre AWT | Post AWT | empty | Pre Retention | Post Retention | empty | Pre Stayed to Watch | Post Stayed to Watch
      const preRange = entry.dateRanges.pre;
      const postRange = entry.dateRanges.post;
      const treatmentDate = entry.treatmentDate || ''; // Simple DD/MM/YYYY format
      const prePeriod = `${formatDateForExport(preRange.start)}-${formatDateForExport(preRange.end)}`;
      const postPeriod = `${formatDateForExport(postRange.start)}-${formatDateForExport(postRange.end)}`;

      exportData = [
        treatmentDate,
        prePeriod,
        postPeriod,
        metrics.pre.impressions || '',
        metrics.post.impressions || '',
        '', // Empty for Change column
        metrics.pre.ctr || '',
        metrics.post.ctr || '',
        '', // Empty for Change column
        metrics.pre.views || '',
        metrics.post.views || '',
        '', // Empty for Change column
        metrics.pre.awt || '',
        metrics.post.awt || '',
        '', // Empty for Change column
        metrics.pre.retention || '',
        metrics.post.retention || '',
        '', // Empty for Change column
        metrics.pre.stayedToWatch || '',
        metrics.post.stayedToWatch || ''
      ].join('\t');

      console.log('Export data:', exportData);

      // Copy to clipboard
      await navigator.clipboard.writeText(exportData);

      // Show success feedback
      button.textContent = '✓ Copied!';
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = '📋 Copy';
        button.classList.remove('copied');
      }, 2000);
    } catch (error) {
      console.error('Error copying data:', error);
      button.textContent = '✗ Error';
      button.classList.add('error');
      setTimeout(() => {
        button.textContent = '📋 Copy';
        button.classList.remove('error');
      }, 2000);
    }
  }

  // Copy batch history entry data to clipboard
  async function copyBatchHistoryEntry(entry, button) {
    try {
      console.log('Copy batch button clicked for entry:', entry);

      if (!entry.results || entry.results.length === 0) {
        console.error('No batch results found');
        button.textContent = '✗ Empty';
        button.classList.add('error');
        setTimeout(() => {
          button.textContent = '📋 Copy';
          button.classList.remove('error');
        }, 2000);
        return;
      }

      // Build TSV data for all videos in batch
      let allRows = [];

      entry.results.forEach(result => {
        if (!result.metrics || !result.metrics.pre || !result.metrics.post) {
          console.warn('Skipping video with invalid metrics:', result.videoId);
          return;
        }

        const preRange = result.dateRanges?.pre || entry.dateRanges?.pre;
        const postRange = result.dateRanges?.post || entry.dateRanges?.post;

        if (!preRange || !postRange) {
          console.warn('Skipping video with missing date ranges:', result.videoId);
          return;
        }

        const treatmentDate = result.treatmentDate || entry.treatmentDate || ''; // Simple DD/MM/YYYY
        const prePeriod = `${formatDateForExport(preRange.start)}-${formatDateForExport(preRange.end)}`;
        const postPeriod = `${formatDateForExport(postRange.start)}-${formatDateForExport(postRange.end)}`;

        const metrics = result.metrics;
        const row = [
          result.videoTitle || '',
          treatmentDate,
          prePeriod,
          postPeriod,
          metrics.pre.impressions || '',
          metrics.post.impressions || '',
          '', // Empty for Change column
          metrics.pre.ctr || '',
          metrics.post.ctr || '',
          '', // Empty for Change column
          metrics.pre.views || '',
          metrics.post.views || '',
          '', // Empty for Change column
          metrics.pre.awt || '',
          metrics.post.awt || '',
          '', // Empty for Change column
          metrics.pre.retention || '',
          metrics.post.retention || '',
          '', // Empty for Change column
          metrics.pre.stayedToWatch || '',
          metrics.post.stayedToWatch || ''
        ].join('\t');

        allRows.push(row);
      });

      if (allRows.length === 0) {
        button.textContent = '✗ Empty';
        button.classList.add('error');
        setTimeout(() => {
          button.textContent = '📋 Copy';
          button.classList.remove('error');
        }, 2000);
        return;
      }

      // Join all rows with newlines
      const exportData = allRows.join('\n');

      console.log(`Batch export data (${allRows.length} videos):`, exportData);

      // Copy to clipboard
      await navigator.clipboard.writeText(exportData);

      // Show success feedback
      button.textContent = `✓ Copied!`;
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = '📋 Copy';
        button.classList.remove('copied');
      }, 2000);
    } catch (error) {
      console.error('Error copying batch data:', error);
      button.textContent = '✗ Error';
      button.classList.add('error');
      setTimeout(() => {
        button.textContent = '📋 Copy';
        button.classList.remove('error');
      }, 2000);
    }
  }

  // Copy single video data from batch entry
  async function copySingleVideoFromBatch(result, button) {
    try {
      console.log('Copy single video from batch:', result);

      const metrics = result.metrics;
      if (!metrics || !metrics.pre || !metrics.post) {
        button.textContent = '✗';
        button.classList.add('error');
        setTimeout(() => {
          button.textContent = '📋';
          button.classList.remove('error');
        }, 2000);
        return;
      }

      // Format treatment date
      const treatmentDate = result.treatmentDate || '';
      const preRange = metrics.periods?.pre ?
        `${formatDateForExport(metrics.periods.pre.start)}-${formatDateForExport(metrics.periods.pre.end)}` : '';
      const postRange = metrics.periods?.post ?
        `${formatDateForExport(metrics.periods.post.start)}-${formatDateForExport(metrics.periods.post.end)}` : '';
      const treatmentLabel = `Pre - ${preRange} Post- ${postRange}`;

      // Build export data (same format as single extraction)
      const row = [
        treatmentLabel,
        metrics.pre.impressions || '',
        metrics.post.impressions || '',
        '', // Empty for Change column
        metrics.pre.ctr || '',
        metrics.post.ctr || '',
        '', // Empty for Change column
        metrics.pre.views || '',
        metrics.post.views || '',
        '', // Empty for Change column
        metrics.pre.awt || '',
        metrics.post.awt || '',
        '', // Empty for Change column
        metrics.pre.retention || '',
        metrics.post.retention || '',
        '', // Empty for Change column
        metrics.pre.stayedToWatch || '',
        metrics.post.stayedToWatch || ''
      ].join('\t');

      console.log('Single video export data:', row);

      // Copy to clipboard
      await navigator.clipboard.writeText(row);

      // Show success feedback
      button.textContent = '✓';
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = '📋';
        button.classList.remove('copied');
      }, 2000);
    } catch (error) {
      console.error('Error copying single video data:', error);
      button.textContent = '✗';
      button.classList.add('error');
      setTimeout(() => {
        button.textContent = '📋';
        button.classList.remove('error');
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
