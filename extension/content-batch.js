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
      cancelBtn.addEventListener('click', async () => {
        console.log('🛑 Cancel button clicked');
        self.shouldCancel = true;
        cancelBtn.disabled = true;
        cancelBtn.textContent = 'Cancelling...';

        // Force cleanup after a short delay if extraction doesn't stop
        setTimeout(async () => {
          if (self.isRunning) {
            console.log('⚠️ Force-stopping stuck batch extraction');
            await safeStorage.set({ batchInProgress: null });
            self.isRunning = false;
            self.shouldCancel = false;

            // Reset UI
            const extractBtn = document.getElementById('batch-extract-btn');
            if (extractBtn) extractBtn.style.display = 'inline-block';
            if (cancelBtn) {
              cancelBtn.style.display = 'none';
              cancelBtn.disabled = false;
              cancelBtn.textContent = 'Cancel';
            }

            // Re-enable inputs
            const urlsInput = document.getElementById('batch-urls-input');
            const treatmentDateInput = document.getElementById('batch-treatment-date');
            if (urlsInput) urlsInput.disabled = false;
            if (treatmentDateInput) treatmentDateInput.disabled = false;
            document.querySelectorAll('input[name="batch-extraction-mode"]').forEach(input => {
              input.disabled = false;
            });

            self.updateStatus('Batch cancelled', 'warning');
          }
        }, 2000); // Give 2 seconds for graceful cancellation
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
   * Perform cleanup after batch extraction (complete or cancelled)
   */
  performCleanup: function(extractBtn, cancelBtn) {
    console.log('🧹 Performing batch cleanup...');

    this.isRunning = false;
    this.shouldCancel = false;

    // Reset buttons
    if (extractBtn) extractBtn.style.display = 'inline-block';
    if (cancelBtn) {
      cancelBtn.style.display = 'none';
      cancelBtn.disabled = false;
      cancelBtn.textContent = 'Cancel';
    }

    // Re-enable inputs
    const urlsInput = document.getElementById('batch-urls-input');
    const treatmentDateInput = document.getElementById('batch-treatment-date');
    if (urlsInput) urlsInput.disabled = false;
    if (treatmentDateInput) treatmentDateInput.disabled = false;
    document.querySelectorAll('input[name="batch-extraction-mode"]').forEach(input => {
      input.disabled = false;
    });

    console.log('✅ Cleanup complete');
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
      let videoId = null;

      // Format 1: YouTube Studio analytics URL
      // https://studio.youtube.com/video/ABC123/analytics
      let match = line.match(/\/video\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        videoId = match[1];
      }

      // Format 2: YouTube watch URL
      // https://www.youtube.com/watch?v=ABC123
      if (!videoId) {
        match = line.match(/[?&]v=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          videoId = match[1];
        }
      }

      // Format 3: YouTube shorts URL
      // https://youtube.com/shorts/ABC123
      if (!videoId) {
        match = line.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          videoId = match[1];
        }
      }

      // Format 4: Short URL
      // https://youtu.be/ABC123
      if (!videoId) {
        match = line.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          videoId = match[1];
        }
      }

      if (videoId) {
        results.push({
          url: line,
          videoId: videoId
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
    // Wait a bit for page to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    const batchState = await safeStorage.get(['batchInProgress']);

    if (batchState.batchInProgress) {
      console.log('🔄 Batch in progress detected - resuming...');
      console.log('Batch state:', batchState.batchInProgress);

      // Restore state
      const state = batchState.batchInProgress;
      this.batchResults = state.results || [];
      this.isRunning = true;

      // Wait for panel to be created
      let attempts = 0;
      while (!document.getElementById('batch-mode-container') && attempts < 10) {
        console.log('Waiting for batch UI to be created...');
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!document.getElementById('batch-mode-container')) {
        console.error('Batch UI not found - cannot resume');
        return;
      }

      console.log(`Resuming from video ${state.currentIndex + 1} of ${state.videos.length}`);

      // Continue extraction
      await this.continueBatchExtraction(state);
    } else {
      console.log('No batch in progress');
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
        console.log(`🛑 Batch cancelled by user at video ${i + 1}`);
        this.updateStatus(`Cancelled after ${i} video(s)`, 'warning');
        await safeStorage.set({ batchInProgress: null });

        // Perform immediate cleanup
        this.performCleanup(batchExtractBtn, batchCancelBtn);
        return; // Exit function immediately
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

        // Navigate and wait for page to reload
        window.location.href = `https://studio.youtube.com/video/${video.videoId}/analytics`;
        return; // Navigation will reload page and resume
      }

      // We're on the right page - wait a bit for page to settle after navigation
      console.log(`On correct video page: ${video.videoId}`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // We're on the right page - extract metrics
      try {
        console.log(`📊 Starting extraction for video ${i + 1} of ${videos.length}: ${video.videoId}`);
        this.updateStatus(`Extracting video ${i + 1} / ${videos.length}: ${video.videoId}`, 'info');

        const result = await this.extractVideoMetrics(video, treatmentDate, extractionMode);

        console.log(`✅ Extraction successful for ${video.videoId}:`, result);
        this.batchResults.push(result);
        this.updateStatus(`Completed ${i + 1} / ${videos.length}`, 'info');

        // Update state in storage
        state.results = this.batchResults;
        await safeStorage.set({ batchInProgress: state });
      } catch (error) {
        console.error(`❌ Error extracting ${video.videoId}:`, error);
        console.error('Error stack:', error.stack);

        this.batchResults.push({
          videoId: video.videoId,
          url: video.url,
          status: 'error',
          error: error.message || error.toString()
        });
        this.updateStatus(`Error on video ${i + 1}: ${error.message}`, 'error');

        // Update state in storage
        state.results = this.batchResults;
        await safeStorage.set({ batchInProgress: state });

        // Show alert for first error to help debug
        if (i === state.currentIndex) {
          alert(`Extraction failed for ${video.videoId}: ${error.message}\n\nCheck console for details.`);
        }
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
    this.performCleanup(batchExtractBtn, batchCancelBtn);
  },

  /**
   * Extract metrics for a single video
   * Returns result object with all metrics
   */
  extractVideoMetrics: async function(video, treatmentDate, extractionMode) {
    console.log(`\n=== EXTRACTION START: ${video.videoId} ===`);
    console.log(`Treatment Date: ${treatmentDate}, Mode: ${extractionMode}`);

    // Wait for analytics page to load - try multiple selectors
    console.log('Step 1: Waiting for analytics page to load...');
    let analyticsLoaded = false;

    try {
      // Try waiting for the analytics page element
      await waitForElement('ytcp-analytics-page', 20000);
      analyticsLoaded = true;
      console.log('✅ Step 1: Analytics page element found');
    } catch (error) {
      console.warn('⚠️ ytcp-analytics-page not found, trying alternate selectors...');

      // Try alternate selector for analytics section
      try {
        await waitForElement('[class*="analytics"]', 10000);
        analyticsLoaded = true;
        console.log('✅ Step 1: Analytics section found via alternate selector');
      } catch (error2) {
        console.error('❌ Step 1: Analytics page did not load after 30 seconds');
        throw new Error('Analytics page did not load - please ensure you are on the Analytics tab');
      }
    }

    // Wait longer for data to populate (analytics can be slow)
    console.log('Step 2: Waiting 5 seconds for analytics data to populate...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Step 2: Wait complete');

    // Get video title from page
    console.log('Step 3: Extracting video title...');
    let videoTitle = 'Unknown Title';
    try {
      // Try to get title from page
      const titleElement = document.querySelector('h1.video-title') ||
                          document.querySelector('[class*="title"]') ||
                          document.querySelector('ytcp-video-metadata-editor-title-description h1');
      if (titleElement) {
        videoTitle = titleElement.textContent.trim();
        console.log(`✅ Step 3: Video title found: "${videoTitle}"`);
      } else {
        console.warn('⚠️ Step 3: Could not find video title element');
      }
    } catch (error) {
      console.warn('⚠️ Step 3: Error extracting video title:', error);
    }

    // Convert treatment date to YYYY-MM-DD
    console.log('Step 4: Converting treatment date format...');
    const treatmentDateYYYYMMDD = YTTreatmentHelper.Utils.formatDateToYYYYMMDD(treatmentDate);
    console.log(`✅ Step 4: Treatment date: ${treatmentDate} → ${treatmentDateYYYYMMDD}`);

    // Get video publish date
    console.log('Step 5: Getting video publish date...');
    const videoPublishDate = YTTreatmentHelper.API.getVideoPublishDate();
    if (!videoPublishDate) {
      console.error('❌ Step 5: Could not determine video publish date');
      throw new Error('Could not determine video publish date');
    }
    console.log(`✅ Step 5: Publish date: ${YTTreatmentHelper.Utils.formatDate(videoPublishDate)}`);

    // Calculate date ranges
    console.log('Step 6: Calculating date ranges...');
    const dateRanges = YTTreatmentHelper.API.calculateDateRanges(treatmentDateYYYYMMDD, videoPublishDate);
    console.log('✅ Step 6: Date ranges calculated:', {
      pre: `${dateRanges.pre.start} to ${dateRanges.pre.end}`,
      post: `${dateRanges.post.start} to ${dateRanges.post.end}`
    });

    // Extract metrics based on mode
    console.log(`Step 7: Starting metrics extraction (${extractionMode})...`);
    let metrics = {};

    if (extractionMode === 'complete') {
      // Extract both equal periods and lifetime
      console.log('Step 7a: Extracting equal periods...');
      const equalResult = await YTTreatmentHelper.API.extractPrePostMetrics(
        dateRanges.pre.start,
        dateRanges.pre.end,
        dateRanges.post.start,
        dateRanges.post.end,
        (status) => console.log(`  [Equal] ${status}`),
        true // include retention
      );
      console.log('✅ Step 7a: Equal periods extracted:', equalResult);

      console.log('Step 7b: Extracting lifetime periods...');
      const lifetimeResult = await YTTreatmentHelper.API.extractPrePostMetrics(
        YTTreatmentHelper.Utils.formatDate(videoPublishDate),
        treatmentDateYYYYMMDD,
        treatmentDateYYYYMMDD,
        YTTreatmentHelper.Utils.formatDate(new Date()),
        (status) => console.log(`  [Lifetime] ${status}`),
        false // no retention for lifetime
      );
      console.log('✅ Step 7b: Lifetime periods extracted:', lifetimeResult);

      metrics = {
        mode: 'complete',
        equal: equalResult,
        lifetime: lifetimeResult
      };
    } else if (extractionMode === 'equal-periods') {
      // Extract equal PRE/POST periods
      console.log('Step 7: Extracting equal periods...');
      const result = await YTTreatmentHelper.API.extractPrePostMetrics(
        dateRanges.pre.start,
        dateRanges.pre.end,
        dateRanges.post.start,
        dateRanges.post.end,
        (status) => console.log(`  ${status}`),
        true // include retention
      );
      console.log('✅ Step 7: Equal periods extracted:', result);
      metrics = { mode: 'equal-periods', ...result };
    } else if (extractionMode === 'lifetime') {
      // Extract lifetime periods (publish to treatment, treatment to today)
      console.log('Step 7: Extracting lifetime periods...');
      const result = await YTTreatmentHelper.API.extractPrePostMetrics(
        YTTreatmentHelper.Utils.formatDate(videoPublishDate),
        treatmentDateYYYYMMDD,
        treatmentDateYYYYMMDD,
        YTTreatmentHelper.Utils.formatDate(new Date()),
        (status) => console.log(`  ${status}`),
        false // no retention for lifetime
      );
      console.log('✅ Step 7: Lifetime periods extracted:', result);
      metrics = { mode: 'lifetime', ...result };
    }

    console.log(`✅ EXTRACTION COMPLETE: ${video.videoId}\n`);

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
