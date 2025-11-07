/**
 * YouTube Treatment Comparison Helper - Batch Mode Module
 * UI and logic for batch video extraction (URL-based)
 */

YTTreatmentHelper.BatchMode = {
  // State
  batchResults: [],
  isRunning: false,
  shouldCancel: false,

  /**
   * Create batch mode UI HTML
   * Returns HTML string to be inserted into the panel
   */
  createBatchUI: function() {
    return `
      <div id="batch-mode-container" style="display: none;">

        <!-- Step 1: Input URLs and Treatment Date -->
        <div class="step-container">
          <div class="step-label">Paste YouTube Studio video URLs (one per line)</div>
          <textarea id="batch-urls-input" class="batch-urls-textarea" placeholder="https://studio.youtube.com/video/ABC123/analytics&#10;https://studio.youtube.com/video/XYZ789/analytics&#10;..."></textarea>
          <div class="batch-url-count" id="batch-url-count">0 videos</div>
        </div>

        <div class="step-container">
          <div class="step-label">Treatment date (DD/MM/YYYY) - applies to all videos</div>
          <input type="text" id="batch-treatment-date" class="date-input" placeholder="DD/MM/YYYY" maxlength="10" />
        </div>

        <!-- Step 2: Extraction Mode -->
        <div class="step-container">
          <div class="step-label">Choose extraction type</div>
          <div class="extraction-mode-options">
            <label class="radio-option">
              <input type="radio" name="batch-extraction-mode" value="complete" checked>
              <div class="radio-content">
                <div class="radio-title">Complete Analysis</div>
                <div class="radio-description">Both equal periods and lifetime (recommended)</div>
              </div>
            </label>
            <label class="radio-option">
              <input type="radio" name="batch-extraction-mode" value="equal-periods">
              <div class="radio-content">
                <div class="radio-title">Equal Periods</div>
                <div class="radio-description">For treatment comparison</div>
              </div>
            </label>
            <label class="radio-option">
              <input type="radio" name="batch-extraction-mode" value="lifetime">
              <div class="radio-content">
                <div class="radio-title">Lifetime</div>
                <div class="radio-description">From publish to treatment, publish to today</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Step 3: Extract Button -->
        <div class="extract-controls">
          <button id="batch-extract-btn" class="action-btn extract-btn">
            <span class="btn-icon">📊</span> Extract Batch
          </button>
          <button id="batch-cancel-btn" class="cancel-btn" style="display: none;">Cancel</button>
        </div>

        <!-- Progress -->
        <div id="batch-progress-container" class="progress-container" style="display: none;">
          <div class="progress-wrapper">
            <div class="progress-bar">
              <div id="batch-progress-fill" class="progress-fill"></div>
            </div>
            <div id="batch-progress-text" class="progress-percent">0 / 0</div>
          </div>
        </div>

        <div id="batch-status" class="extraction-status" style="display: none;"></div>

        <!-- Step 4: Results Table -->
        <div id="batch-results-section" style="display: none;">
          <div class="step-container">
            <div class="step-label">Extraction Results</div>
          </div>

          <div class="batch-results-table-container">
            <table id="batch-results-table" class="batch-results-table">
              <thead>
                <tr>
                  <th>Video</th>
                  <th>Status</th>
                  <th>Metrics</th>
                </tr>
              </thead>
              <tbody id="batch-results-tbody">
              </tbody>
            </table>
          </div>

          <!-- Export Buttons -->
          <div class="batch-export-section">
            <button id="batch-copy-btn" class="copy-btn export-btn">
              <span class="btn-icon">📋</span> Copy to Clipboard
            </button>
            <button id="batch-download-btn" class="action-btn export-btn">
              <span class="btn-icon">💾</span> Download CSV
            </button>
          </div>
        </div>

      </div>
    `;
  },

  /**
   * Initialize batch mode event listeners
   */
  initEventListeners: function() {
    const self = this;

    // URL count update
    const urlsInput = document.getElementById('batch-urls-input');
    if (urlsInput) {
      urlsInput.addEventListener('input', () => {
        self.updateUrlCount();
      });
    }

    // Date formatting
    const treatmentDateInput = document.getElementById('batch-treatment-date');
    if (treatmentDateInput) {
      YTTreatmentHelper.Utils.autoFormatDateInput(treatmentDateInput);
    }

    // Extract button
    const extractBtn = document.getElementById('batch-extract-btn');
    if (extractBtn) {
      extractBtn.addEventListener('click', () => {
        self.startBatchExtraction();
      });
    }

    // Cancel button
    const cancelBtn = document.getElementById('batch-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        self.shouldCancel = true;
        cancelBtn.disabled = true;
        cancelBtn.textContent = 'Cancelling...';
      });
    }

    // Copy button
    const copyBtn = document.getElementById('batch-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        self.copyResultsToClipboard();
      });
    }

    // Download button
    const downloadBtn = document.getElementById('batch-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        self.downloadResultsAsCSV();
      });
    }
  },

  /**
   * Update URL count display
   */
  updateUrlCount: function() {
    const urlsInput = document.getElementById('batch-urls-input');
    const countDisplay = document.getElementById('batch-url-count');

    if (!urlsInput || !countDisplay) return;

    const urls = this.parseUrls(urlsInput.value);
    const count = urls.length;
    countDisplay.textContent = `${count} video${count !== 1 ? 's' : ''}`;
  },

  /**
   * Parse URLs from textarea
   * Returns array of {url, videoId} objects
   */
  parseUrls: function(text) {
    if (!text || !text.trim()) return [];

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const results = [];

    for (const line of lines) {
      // Extract video ID from various URL formats
      const match = line.match(/\/video\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        results.push({
          url: line,
          videoId: match[1]
        });
      }
    }

    return results;
  },

  /**
   * Check if batch is in progress (from storage)
   * Called on page load to resume interrupted batches
   */
  checkAndResumeBatch: async function() {
    const batchState = await safeStorage.get(['batchInProgress']);

    if (batchState.batchInProgress) {
      console.log('Resuming batch extraction...');

      // Restore state
      const state = batchState.batchInProgress;
      this.batchResults = state.results || [];
      this.isRunning = true;

      // Continue extraction
      await this.continueBatchExtraction(state);
    }
  },

  /**
   * Start batch extraction process
   */
  startBatchExtraction: async function() {
    const self = this;

    // Get inputs
    const urlsInput = document.getElementById('batch-urls-input');
    const treatmentDateInput = document.getElementById('batch-treatment-date');
    const extractionMode = document.querySelector('input[name="batch-extraction-mode"]:checked');

    if (!urlsInput || !treatmentDateInput || !extractionMode) {
      alert('Missing required inputs');
      return;
    }

    // Parse URLs
    const videos = this.parseUrls(urlsInput.value);
    if (videos.length === 0) {
      alert('Please paste at least one valid YouTube Studio video URL');
      return;
    }

    // Validate treatment date
    const treatmentDate = treatmentDateInput.value.trim();
    if (!treatmentDate || treatmentDate.split('/').length !== 3) {
      alert('Please enter a valid treatment date (DD/MM/YYYY)');
      return;
    }

    // Confirm before starting
    const confirmed = confirm(`Extract metrics for ${videos.length} video(s) with treatment date ${treatmentDate}?`);
    if (!confirmed) return;

    // Reset state
    this.batchResults = [];
    this.shouldCancel = false;

    // Save batch state to storage
    const batchState = {
      videos: videos,
      treatmentDate: treatmentDate,
      extractionMode: extractionMode.value,
      currentIndex: 0,
      results: []
    };

    await safeStorage.set({ batchInProgress: batchState });

    // Start extraction
    await this.continueBatchExtraction(batchState);
  },

  /**
   * Continue batch extraction (can be called after page navigation)
   */
  continueBatchExtraction: async function(state) {
    const { videos, treatmentDate, extractionMode, currentIndex, results } = state;

    // Check if we need to show UI (might not exist after page navigation)
    const batchExtractBtn = document.getElementById('batch-extract-btn');
    const batchCancelBtn = document.getElementById('batch-cancel-btn');
    const progressContainer = document.getElementById('batch-progress-container');
    const statusDiv = document.getElementById('batch-status');
    const resultsSection = document.getElementById('batch-results-section');

    // If UI exists, update it
    if (batchExtractBtn && batchCancelBtn && progressContainer && statusDiv) {
      batchExtractBtn.style.display = 'none';
      batchCancelBtn.style.display = 'inline-block';
      progressContainer.style.display = 'block';
      statusDiv.style.display = 'block';
      if (resultsSection) resultsSection.style.display = 'none';
    }

    this.isRunning = true;
    this.batchResults = results;

    // Process remaining videos
    for (let i = currentIndex; i < videos.length; i++) {
      if (this.shouldCancel) {
        this.updateStatus(`Cancelled after ${i} video(s)`, 'warning');
        await safeStorage.set({ batchInProgress: null });
        break;
      }

      const video = videos[i];
      this.updateProgress(i, videos.length, `Processing ${video.videoId}...`);

      // Check if we're on the right video page
      const currentVideoId = YTTreatmentHelper.Utils.getVideoIdFromUrl();

      if (currentVideoId !== video.videoId) {
        // Need to navigate - save state and navigate
        state.currentIndex = i;
        state.results = this.batchResults;
        await safeStorage.set({ batchInProgress: state });

        console.log(`Navigating to video ${video.videoId}...`);
        window.location.href = `https://studio.youtube.com/video/${video.videoId}/analytics`;
        return; // Navigation will reload page and resume
      }

      // We're on the right page - extract metrics
      try {
        const result = await this.extractVideoMetrics(video, treatmentDate, extractionMode);
        this.batchResults.push(result);
        this.updateStatus(`Completed ${i + 1} / ${videos.length}`, 'info');

        // Update state in storage
        state.results = this.batchResults;
        await safeStorage.set({ batchInProgress: state });
      } catch (error) {
        console.error(`Error extracting ${video.videoId}:`, error);
        this.batchResults.push({
          videoId: video.videoId,
          url: video.url,
          status: 'error',
          error: error.message
        });
        this.updateStatus(`Error on video ${i + 1}: ${error.message}`, 'error');

        // Update state in storage
        state.results = this.batchResults;
        await safeStorage.set({ batchInProgress: state });
      }

      // Small delay before next video
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Complete - clear batch state
    await safeStorage.set({ batchInProgress: null });

    this.updateProgress(videos.length, videos.length, 'Complete');
    this.updateStatus(`Extracted ${this.batchResults.length} video(s)`, 'success');

    // Show results
    this.displayResults();

    // UI cleanup
    this.isRunning = false;
    if (batchExtractBtn && batchCancelBtn) {
      batchExtractBtn.style.display = 'inline-block';
      batchCancelBtn.style.display = 'none';
    }

    // Re-enable inputs
    const urlsInput = document.getElementById('batch-urls-input');
    const treatmentDateInput = document.getElementById('batch-treatment-date');
    if (urlsInput) urlsInput.disabled = false;
    if (treatmentDateInput) treatmentDateInput.disabled = false;
    document.querySelectorAll('input[name="batch-extraction-mode"]').forEach(input => {
      input.disabled = false;
    });
  },

  /**
   * Extract metrics for a single video
   * Returns result object with all metrics
   */
  extractVideoMetrics: async function(video, treatmentDate, extractionMode) {
    console.log(`Extracting metrics for ${video.videoId}...`);

    // Wait for analytics page to load
    try {
      await waitForElement('ytcp-analytics-page', 15000);
    } catch (error) {
      throw new Error('Analytics page did not load');
    }

    // Wait a bit more for data to populate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get video title from page
    let videoTitle = 'Unknown Title';
    try {
      // Try to get title from page
      const titleElement = document.querySelector('h1.video-title') ||
                          document.querySelector('[class*="title"]') ||
                          document.querySelector('ytcp-video-metadata-editor-title-description h1');
      if (titleElement) {
        videoTitle = titleElement.textContent.trim();
      }
    } catch (error) {
      console.warn('Could not extract video title:', error);
    }

    // Convert treatment date to YYYY-MM-DD
    const treatmentDateYYYYMMDD = YTTreatmentHelper.Utils.formatDateToYYYYMMDD(treatmentDate);

    // Get video publish date
    const videoPublishDate = YTTreatmentHelper.API.getVideoPublishDate();
    if (!videoPublishDate) {
      throw new Error('Could not determine video publish date');
    }

    // Calculate date ranges
    const dateRanges = YTTreatmentHelper.API.calculateDateRanges(treatmentDateYYYYMMDD, videoPublishDate);

    // Extract metrics based on mode
    let metrics = {};

    if (extractionMode === 'complete') {
      // Extract both equal periods and lifetime
      console.log('Extracting complete analysis...');

      // First extract equal periods
      const equalResult = await YTTreatmentHelper.API.extractPrePostMetrics(
        dateRanges.pre.start,
        dateRanges.pre.end,
        dateRanges.post.start,
        dateRanges.post.end,
        (status) => console.log(`[Equal] ${status}`),
        true // include retention
      );

      // Then extract lifetime periods
      const lifetimeResult = await YTTreatmentHelper.API.extractPrePostMetrics(
        YTTreatmentHelper.Utils.formatDate(videoPublishDate),
        treatmentDateYYYYMMDD,
        treatmentDateYYYYMMDD,
        YTTreatmentHelper.Utils.formatDate(new Date()),
        (status) => console.log(`[Lifetime] ${status}`),
        false // no retention for lifetime
      );

      metrics = {
        mode: 'complete',
        equal: equalResult,
        lifetime: lifetimeResult
      };
    } else if (extractionMode === 'equal-periods') {
      // Extract equal PRE/POST periods
      console.log('Extracting equal periods...');
      const result = await YTTreatmentHelper.API.extractPrePostMetrics(
        dateRanges.pre.start,
        dateRanges.pre.end,
        dateRanges.post.start,
        dateRanges.post.end,
        (status) => console.log(status),
        true // include retention
      );
      metrics = { mode: 'equal-periods', ...result };
    } else if (extractionMode === 'lifetime') {
      // Extract lifetime periods (publish to treatment, treatment to today)
      console.log('Extracting lifetime periods...');
      const result = await YTTreatmentHelper.API.extractPrePostMetrics(
        YTTreatmentHelper.Utils.formatDate(videoPublishDate),
        treatmentDateYYYYMMDD,
        treatmentDateYYYYMMDD,
        YTTreatmentHelper.Utils.formatDate(new Date()),
        (status) => console.log(status),
        false // no retention for lifetime
      );
      metrics = { mode: 'lifetime', ...result };
    }

    console.log(`Extraction complete for ${video.videoId}`);

    return {
      videoId: video.videoId,
      videoTitle: videoTitle,
      url: video.url,
      status: 'success',
      metrics: metrics,
      treatmentDate: treatmentDate
    };
  },

  /**
   * Update progress bar
   */
  updateProgress: function(current, total, text) {
    const progressFill = document.getElementById('batch-progress-fill');
    const progressText = document.getElementById('batch-progress-text');

    if (progressFill) {
      const percent = total > 0 ? (current / total) * 100 : 0;
      progressFill.style.width = `${percent}%`;
    }

    if (progressText) {
      progressText.textContent = text || `${current} / ${total}`;
    }
  },

  /**
   * Update status message
   */
  updateStatus: function(message, type = 'info') {
    const statusDiv = document.getElementById('batch-status');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `extraction-status ${type}`;
    statusDiv.style.display = 'block';
  },

  /**
   * Display results in table
   */
  displayResults: function() {
    const resultsSection = document.getElementById('batch-results-section');
    const tbody = document.getElementById('batch-results-tbody');

    if (!resultsSection || !tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    // Add rows for each result
    for (const result of this.batchResults) {
      const row = document.createElement('tr');
      row.className = result.status === 'success' ? 'success' : 'error';

      const videoCell = document.createElement('td');
      videoCell.innerHTML = `
        <div class="video-info">
          <div class="video-title">${result.videoTitle || result.videoId}</div>
          <div class="video-id">${result.videoId}</div>
        </div>
      `;

      const statusCell = document.createElement('td');
      statusCell.textContent = result.status === 'success' ? '✓ Success' : '✗ Error';
      statusCell.className = `status-${result.status}`;

      const metricsCell = document.createElement('td');
      if (result.status === 'success') {
        metricsCell.textContent = `${result.metrics.mode} extracted`;
      } else {
        metricsCell.textContent = result.error || 'Unknown error';
      }

      row.appendChild(videoCell);
      row.appendChild(statusCell);
      row.appendChild(metricsCell);

      tbody.appendChild(row);
    }

    resultsSection.style.display = 'block';
  },

  /**
   * Copy results to clipboard as TSV
   */
  copyResultsToClipboard: async function() {
    const tsv = this.formatResultsAsTSV();

    try {
      await navigator.clipboard.writeText(tsv);

      const btn = document.getElementById('batch-copy-btn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
      btn.classList.add('success');

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('success');
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy to clipboard');
    }
  },

  /**
   * Download results as CSV file
   */
  downloadResultsAsCSV: function() {
    const csv = this.formatResultsAsTSV(); // TSV is valid CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `youtube-metrics-batch-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  },

  /**
   * Format results as TSV (tab-separated values)
   * Returns string ready for clipboard or file download
   */
  formatResultsAsTSV: function() {
    if (this.batchResults.length === 0) {
      return '';
    }

    // Determine format based on first result's extraction mode
    const firstResult = this.batchResults[0];
    const mode = firstResult.metrics?.mode;

    if (mode === 'complete') {
      return this.formatCompleteAnalysisTSV();
    } else if (mode === 'equal-periods') {
      return this.formatEqualPeriodsTSV();
    } else if (mode === 'lifetime') {
      return this.formatLifetimeTSV();
    } else {
      // Fallback format
      return this.formatBasicTSV();
    }
  },

  /**
   * Format complete analysis results (both equal periods and lifetime)
   */
  formatCompleteAnalysisTSV: function() {
    const headers = [
      'URL',
      'Video Title',
      'Video ID',
      'Treatment Date',
      // Equal Periods
      'Equal Pre Impressions',
      'Equal Post Impressions',
      'Equal Pre CTR',
      'Equal Post CTR',
      'Equal Pre Views',
      'Equal Post Views',
      'Equal Pre AWT',
      'Equal Post AWT',
      'Equal Pre Retention',
      'Equal Post Retention',
      'Equal Pre Stayed to Watch',
      'Equal Post Stayed to Watch',
      // Lifetime
      'Lifetime Pre Impressions',
      'Lifetime Post Impressions',
      'Lifetime Pre CTR',
      'Lifetime Post CTR',
      'Lifetime Pre Views',
      'Lifetime Post Views',
      'Lifetime Pre AWT',
      'Lifetime Post AWT'
    ];

    const rows = [headers.join('\t')];

    for (const result of this.batchResults) {
      if (result.status !== 'success') {
        // Error row
        rows.push([result.url, result.videoTitle, result.videoId, 'ERROR: ' + (result.error || 'Unknown error')].join('\t'));
        continue;
      }

      const equal = result.metrics.equal || {};
      const lifetime = result.metrics.lifetime || {};

      const row = [
        result.url,
        result.videoTitle,
        result.videoId,
        result.treatmentDate,
        // Equal periods
        equal.pre?.impressions || '',
        equal.post?.impressions || '',
        equal.pre?.ctr || '',
        equal.post?.ctr || '',
        equal.pre?.views || '',
        equal.post?.views || '',
        equal.pre?.awt || '',
        equal.post?.awt || '',
        equal.pre?.retention || '',
        equal.post?.retention || '',
        equal.pre?.stayedToWatch || '',
        equal.post?.stayedToWatch || '',
        // Lifetime
        lifetime.pre?.impressions || '',
        lifetime.post?.impressions || '',
        lifetime.pre?.ctr || '',
        lifetime.post?.ctr || '',
        lifetime.pre?.views || '',
        lifetime.post?.views || '',
        lifetime.pre?.awt || '',
        lifetime.post?.awt || ''
      ];

      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  },

  /**
   * Format equal periods results
   */
  formatEqualPeriodsTSV: function() {
    const headers = [
      'URL',
      'Video Title',
      'Video ID',
      'Treatment Date',
      'Pre Impressions',
      'Post Impressions',
      'Pre CTR',
      'Post CTR',
      'Pre Views',
      'Post Views',
      'Pre AWT',
      'Post AWT',
      'Pre Retention',
      'Post Retention',
      'Pre Stayed to Watch',
      'Post Stayed to Watch'
    ];

    const rows = [headers.join('\t')];

    for (const result of this.batchResults) {
      if (result.status !== 'success') {
        rows.push([result.url, result.videoTitle, result.videoId, 'ERROR: ' + (result.error || 'Unknown error')].join('\t'));
        continue;
      }

      const row = [
        result.url,
        result.videoTitle,
        result.videoId,
        result.treatmentDate,
        result.metrics.pre?.impressions || '',
        result.metrics.post?.impressions || '',
        result.metrics.pre?.ctr || '',
        result.metrics.post?.ctr || '',
        result.metrics.pre?.views || '',
        result.metrics.post?.views || '',
        result.metrics.pre?.awt || '',
        result.metrics.post?.awt || '',
        result.metrics.pre?.retention || '',
        result.metrics.post?.retention || '',
        result.metrics.pre?.stayedToWatch || '',
        result.metrics.post?.stayedToWatch || ''
      ];

      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  },

  /**
   * Format lifetime results
   */
  formatLifetimeTSV: function() {
    const headers = [
      'URL',
      'Video Title',
      'Video ID',
      'Treatment Date',
      'Pre Impressions (Publish to Treatment)',
      'Post Impressions (Treatment to Today)',
      'Pre CTR',
      'Post CTR',
      'Pre Views',
      'Post Views',
      'Pre AWT',
      'Post AWT'
    ];

    const rows = [headers.join('\t')];

    for (const result of this.batchResults) {
      if (result.status !== 'success') {
        rows.push([result.url, result.videoTitle, result.videoId, 'ERROR: ' + (result.error || 'Unknown error')].join('\t'));
        continue;
      }

      const row = [
        result.url,
        result.videoTitle,
        result.videoId,
        result.treatmentDate,
        result.metrics.pre?.impressions || '',
        result.metrics.post?.impressions || '',
        result.metrics.pre?.ctr || '',
        result.metrics.post?.ctr || '',
        result.metrics.pre?.views || '',
        result.metrics.post?.views || '',
        result.metrics.pre?.awt || '',
        result.metrics.post?.awt || ''
      ];

      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  },

  /**
   * Format basic results (fallback)
   */
  formatBasicTSV: function() {
    const headers = ['URL', 'Video Title', 'Video ID', 'Status', 'Treatment Date'];
    const rows = [headers.join('\t')];

    for (const result of this.batchResults) {
      const row = [
        result.url,
        result.videoTitle || '',
        result.videoId,
        result.status,
        result.treatmentDate || ''
      ];
      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  }
};

console.log('Batch mode module loaded');
