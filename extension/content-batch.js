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

          <!-- Summary Card -->
          <div class="batch-summary-card">
            <div class="batch-summary-stat success">
              <span class="summary-icon">✓</span>
              <span class="summary-count" id="batch-summary-success">0</span>
              <span class="summary-label">successful</span>
            </div>
            <div class="batch-summary-stat partial">
              <span class="summary-icon">⚠</span>
              <span class="summary-count" id="batch-summary-partial">0</span>
              <span class="summary-label">partial</span>
            </div>
            <div class="batch-summary-stat error">
              <span class="summary-icon">✗</span>
              <span class="summary-count" id="batch-summary-error">0</span>
              <span class="summary-label">failed</span>
            </div>
          </div>

          <!-- Problems Section Header -->
          <div class="batch-problems-header">
            <span class="problems-title">Videos Needing Attention (<span id="batch-problems-count">0</span>)</span>
            <button id="batch-toggle-all-btn" class="toggle-all-btn">Show all <span id="batch-total-count">0</span> videos ▼</button>
          </div>

          <div class="batch-results-table-container">
            <table id="batch-results-table" class="batch-results-table">
              <thead>
                <tr>
                  <th>Video</th>
                  <th>Status</th>
                  <th>Details</th>
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

        <!-- Batch History Section -->
        <div id="batch-history-section" class="history-section" style="display: none;">
          <div class="history-header">
            <div class="history-title">
              <span class="history-icon">📜</span>
              <span>Batch History</span>
            </div>
            <button id="toggle-batch-history-btn" class="toggle-history-btn">Show History</button>
          </div>

          <div id="batch-history-content" class="history-content" style="display: none;">
            <div id="batch-history-list" class="history-list">
              <!-- History items will be dynamically inserted here -->
            </div>
            <div class="history-actions">
              <button id="clear-batch-history-btn" class="clear-history-btn">Clear History</button>
            </div>
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

    // Ensure pointer-events are enabled on inputs immediately
    // (CSS sometimes gets overridden by YouTube Studio's global styles)
    document.querySelectorAll('#yt-treatment-helper input[type="text"]:not([disabled]), #yt-treatment-helper textarea:not([disabled])').forEach(input => {
      input.style.pointerEvents = 'auto';
      input.style.userSelect = 'text';
    });

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

    // Initialize batch history
    this.initBatchHistory();
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

    // Re-enable batch mode inputs
    const urlsInput = document.getElementById('batch-urls-input');
    const treatmentDateInput = document.getElementById('batch-treatment-date');

    if (urlsInput) urlsInput.disabled = false;
    if (treatmentDateInput) treatmentDateInput.disabled = false;

    // Re-enable radio buttons
    document.querySelectorAll('input[name="batch-extraction-mode"]').forEach(input => {
      input.disabled = false;
    });

    console.log('✅ Batch cleanup complete');
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
    // Minimal wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 1000ms

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

    // Start timing the batch extraction
    const batchStartTime = Date.now();

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

    // Reset state
    this.batchResults = [];
    this.shouldCancel = false;

    // Save batch state to storage (including start time)
    const batchState = {
      videos: videos,
      treatmentDate: treatmentDate,
      extractionMode: extractionMode.value,
      currentIndex: 0,
      results: [],
      startTime: batchStartTime
    };

    await safeStorage.set({ batchInProgress: batchState });

    // Start extraction
    await this.continueBatchExtraction(batchState);
  },

  /**
   * Continue batch extraction (can be called after page navigation)
   */
  continueBatchExtraction: async function(state) {
    const { videos, treatmentDate, extractionMode, currentIndex, results, startTime } = state;

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

    // Calculate total steps for entire batch
    // Complete: 23 steps per video (6 setup + 11 equal + 6 lifetime)
    // Equal-periods: 17 steps per video (6 setup + 11 equal)
    // Lifetime: 12 steps per video (6 setup + 6 lifetime)
    const stepsPerVideo = extractionMode === 'complete' ? 23 : (extractionMode === 'equal-periods' ? 17 : 12);
    const totalBatchSteps = videos.length * stepsPerVideo;
    console.log(`📊 Batch extraction: ${videos.length} videos × ${stepsPerVideo} steps = ${totalBatchSteps} total steps`);

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

      // Calculate steps completed so far
      const stepsCompletedBefore = i * stepsPerVideo;

      // Check if we're on the right video page
      const currentVideoId = YTTreatmentHelper.Utils.getVideoIdFromUrl();

      if (currentVideoId !== video.videoId) {
        // Need to navigate - save state and navigate
        state.currentIndex = i;
        state.results = this.batchResults;
        await safeStorage.set({ batchInProgress: state });

        console.log(`Navigating to video ${video.videoId}...`);
        this.updateProgress(stepsCompletedBefore, totalBatchSteps, `Navigating to video ${i + 1}/${videos.length}...`);

        // Navigate and wait for page to reload
        window.location.href = `https://studio.youtube.com/video/${video.videoId}/analytics`;
        return; // Navigation will reload page and resume
      }

      // We're on the right page - tiny delay to ensure page is stable
      console.log(`On correct video page: ${video.videoId}`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 300ms

      // We're on the right page - extract metrics
      try {
        console.log(`📊 Starting extraction for video ${i + 1} of ${videos.length}: ${video.videoId}`);

        // Create progress callback that updates batch progress
        const progressCallback = (stepNum, totalSteps, stepDescription) => {
          const overallStep = stepsCompletedBefore + stepNum;
          const progressPercent = Math.round((overallStep / totalBatchSteps) * 100);

          this.updateProgress(
            overallStep,
            totalBatchSteps,
            `${overallStep}/${totalBatchSteps} (${progressPercent}%)`
          );

          this.updateStatus(
            `Video ${i + 1}/${videos.length}: ${stepDescription}`,
            'info'
          );
        };

        const result = await this.extractVideoMetrics(video, treatmentDate, extractionMode, progressCallback);

        // Result will always be returned (success, partial, or error)
        this.batchResults.push(result);

        // Log and show status based on result
        if (result.status === 'success') {
          console.log(`✅ Extraction successful for ${video.videoId}`);
          this.updateStatus(`Completed video ${i + 1} / ${videos.length}`, 'success');
        } else if (result.status === 'partial') {
          console.log(`⚠️ Partial extraction for ${video.videoId} - errors: ${result.errors.join(', ')}`);
          this.updateStatus(`Video ${i + 1} / ${videos.length}: Partial (${result.errors.length} errors)`, 'warning');
        } else {
          console.error(`❌ Extraction failed for ${video.videoId} - errors: ${result.errors.join(', ')}`);
          this.updateStatus(`Video ${i + 1} / ${videos.length}: Failed`, 'error');
        }

        // Update to show video completed
        const stepsCompletedAfter = (i + 1) * stepsPerVideo;
        this.updateProgress(stepsCompletedAfter, totalBatchSteps, `${stepsCompletedAfter}/${totalBatchSteps}`);

        // Update state in storage
        state.results = this.batchResults;
        await safeStorage.set({ batchInProgress: state });
      } catch (error) {
        // This should rarely happen now since extractVideoMetrics handles its own errors
        console.error(`❌ Unexpected error extracting ${video.videoId}:`, error);
        console.error('Error stack:', error.stack);

        this.batchResults.push({
          videoId: video.videoId,
          url: video.url,
          videoTitle: null,
          publishDate: null,
          treatmentDate: treatmentDate,
          status: 'error',
          metrics: null,
          dateRanges: null,
          errors: [`Unexpected error: ${error.message || error.toString()}`]
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

    // Calculate timing and time saved
    const batchEndTime = Date.now();
    const durationMs = batchEndTime - (startTime || batchEndTime); // Fallback if startTime missing

    // Estimate manual extraction time (45 seconds per video)
    const MANUAL_TIME_PER_VIDEO_MS = 45000;
    const estimatedManualTimeMs = videos.length * MANUAL_TIME_PER_VIDEO_MS;
    const timeSavedMs = Math.max(0, estimatedManualTimeMs - durationMs);

    // Save to batch history
    await YTTreatmentHelper.ExtractionHistory.saveBatchExtraction({
      treatmentDate: treatmentDate,
      mode: extractionMode,
      results: this.batchResults,
      durationMs: durationMs,
      estimatedManualTimeMs: estimatedManualTimeMs,
      timeSavedMs: timeSavedMs
    });

    console.log('Batch extraction saved to history');

    this.updateProgress(videos.length, videos.length, 'Complete');

    // Show time saved message
    const timeSavedMinutes = Math.floor(timeSavedMs / 60000);
    const timeSavedSeconds = Math.floor((timeSavedMs % 60000) / 1000);
    const actualMinutes = Math.floor(durationMs / 60000);
    const actualSeconds = Math.floor((durationMs % 60000) / 1000);

    let statusMessage = `Extracted ${this.batchResults.length} video(s) in ${actualMinutes}m ${actualSeconds}s`;
    if (timeSavedMs > 0) {
      statusMessage += ` - You saved ${timeSavedMinutes}m ${timeSavedSeconds}s!`;
    }

    this.updateStatus(statusMessage, 'success');

    // Show results
    this.displayResults();

    // UI cleanup
    this.performCleanup(batchExtractBtn, batchCancelBtn);
  },

  /**
   * Format date for export (DD.MM.YYYY)
   * Converts YYYY-MM-DD to DD.MM.YYYY
   */
  formatDateForExport: function(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  },

  /**
   * Helper: Extract retention value from retention object
   * Handles both successful extraction and error cases
   */
  getRetentionValue: function(retentionObj) {
    if (!retentionObj) return '';
    // Retention is an object with { value, targetTime, isShort, videoDuration }
    // or { value, error } on error
    return retentionObj.value || '';
  },

  /**
   * Helper: Extract stayed-to-watch value, mark as N/A for long-form
   * Stayed-to-watch is only applicable to Shorts (< 60s)
   */
  getStayedToWatchValue: function(stayedToWatch, retentionObj) {
    // Check if this is a long-form video (not a Short)
    const isLongForm = retentionObj && retentionObj.isShort === false;

    if (isLongForm) {
      return 'N/A - Long-form';
    }

    return stayedToWatch || '';
  },

  /**
   * Extract metrics for a single video
   * Returns result object with all metrics (or partial data with errors)
   * @param {Object} progressCallback - Optional callback(stepNum, totalSteps, stepDescription)
   */
  extractVideoMetrics: async function(video, treatmentDate, extractionMode, progressCallback = null) {
    console.log(`\n=== EXTRACTION START: ${video.videoId} ===`);
    console.log(`Treatment Date: ${treatmentDate}, Mode: ${extractionMode}`);

    // Initialize partial result object early - this will be returned even if errors occur
    const partialResult = {
      videoId: video.videoId,
      url: video.url,
      videoTitle: null,
      publishDate: null,
      treatmentDate: treatmentDate,
      status: 'partial', // Will be updated to 'success' or 'error'
      metrics: null,
      dateRanges: null,
      errors: [] // Track which steps failed
    };

    // Calculate total steps based on extraction mode
    const totalSteps = extractionMode === 'complete' ? 23 : (extractionMode === 'equal-periods' ? 17 : 12);
    let currentStep = 0;

    // Step 1-2: Wait for analytics page to load
    console.log('Step 1: Waiting for analytics page to load...');
    if (progressCallback) progressCallback(++currentStep, totalSteps, 'Waiting for analytics page...');

    try {
      await waitForElement('ytcp-analytics-page', 5000);
      console.log('✅ Step 1: Analytics page element found');
    } catch (error) {
      console.warn('⚠️ ytcp-analytics-page not found, trying alternate selectors...');
      try {
        await waitForElement('[class*="analytics"]', 3000);
        console.log('✅ Step 1: Analytics section found via alternate selector');
      } catch (error2) {
        console.error('❌ Step 1: Analytics page did not load');
        partialResult.errors.push('Analytics page failed to load');
        partialResult.status = 'error';
        return partialResult;
      }
    }

    console.log('✅ Step 2: Analytics page loaded, proceeding to extraction');
    if (progressCallback) progressCallback(++currentStep, totalSteps, 'Analytics page loaded');

    // Step 3: Extract video title (non-critical - can continue if fails)
    console.log('Step 3: Navigating to Details tab to extract video title...');
    if (progressCallback) progressCallback(++currentStep, totalSteps, 'Navigating to Details tab...');

    try {
      await YTTreatmentHelper.API.navigateToDetailsTab();
      console.log('✅ Step 3a: Details tab loaded');
      if (progressCallback) progressCallback(++currentStep, totalSteps, 'Extracting video title...');

      partialResult.videoTitle = YTTreatmentHelper.API.extractVideoTitle();
      console.log(`✅ Step 3b: Video title extracted: "${partialResult.videoTitle}"`);

      console.log('Step 3c: Navigating back to Analytics tab...');
      if (progressCallback) progressCallback(++currentStep, totalSteps, 'Returning to Analytics tab...');
      await YTTreatmentHelper.API.navigateToAnalyticsTab();
      console.log('✅ Step 3c: Back on Analytics tab');
    } catch (error) {
      console.warn('⚠️ Step 3: Error extracting video title:', error);
      partialResult.videoTitle = 'ERROR: Title extraction failed';
      partialResult.errors.push('Title extraction failed');
      currentStep += 2; // Account for skipped steps
    }

    // Step 4: Convert treatment date
    console.log('Step 4: Converting treatment date format...');
    let treatmentDateYYYYMMDD;
    try {
      treatmentDateYYYYMMDD = YTTreatmentHelper.Utils.formatDateToYYYYMMDD(treatmentDate);
      console.log(`✅ Step 4: Treatment date: ${treatmentDate} → ${treatmentDateYYYYMMDD}`);
      if (progressCallback) progressCallback(++currentStep, totalSteps, 'Calculating date ranges...');
    } catch (error) {
      console.error('❌ Step 4: Invalid treatment date format');
      partialResult.errors.push('Invalid treatment date format');
      partialResult.status = 'error';
      return partialResult;
    }

    // Step 5: Get video publish date (critical)
    console.log('Step 5: Getting video publish date...');
    let videoPublishDate;
    try {
      videoPublishDate = YTTreatmentHelper.API.getVideoPublishDate();
      if (!videoPublishDate) {
        throw new Error('Could not determine video publish date');
      }
      partialResult.publishDate = this.formatDateForExport(YTTreatmentHelper.Utils.formatDate(videoPublishDate));
      console.log(`✅ Step 5: Publish date: ${YTTreatmentHelper.Utils.formatDate(videoPublishDate)}`);
    } catch (error) {
      console.error('❌ Step 5: Could not determine video publish date');
      partialResult.errors.push('Publish date extraction failed');
      partialResult.status = 'error';
      return partialResult;
    }

    // Step 6: Calculate date ranges (critical)
    console.log('Step 6: Calculating date ranges...');
    let dateRanges;
    try {
      dateRanges = YTTreatmentHelper.API.calculateDateRanges(treatmentDateYYYYMMDD, videoPublishDate);
      console.log('✅ Step 6: Date ranges calculated:', {
        pre: `${dateRanges.pre.start} to ${dateRanges.pre.end}`,
        post: `${dateRanges.post.start} to ${dateRanges.post.end}`
      });
    } catch (error) {
      console.error('❌ Step 6: Date range calculation failed:', error);
      partialResult.errors.push('Date range calculation failed');
      partialResult.status = 'error';
      return partialResult;
    }

    // Step 7: Extract metrics (granular error handling per mode)
    console.log(`Step 7: Starting metrics extraction (${extractionMode})...`);
    let metrics = { mode: extractionMode };
    let metricsExtracted = false;

    try {
      if (extractionMode === 'complete') {
        // Extract both equal periods and lifetime
        console.log('Step 7a: Extracting equal periods...');

        const equalProgressCallback = progressCallback ? (subStep, totalSubSteps, desc) => {
          const overallStep = currentStep + subStep;
          progressCallback(overallStep, totalSteps, `[Equal] ${desc}`);
        } : null;

        try {
          const equalResult = await YTTreatmentHelper.API.extractPrePostMetrics(
            dateRanges.pre.start,
            dateRanges.pre.end,
            dateRanges.post.start,
            dateRanges.post.end,
            (status) => console.log(`  [Equal] ${status}`),
            true,
            equalProgressCallback
          );
          console.log('✅ Step 7a: Equal periods extracted:', equalResult);
          metrics.equal = equalResult;
          metricsExtracted = true;
        } catch (error) {
          console.error('❌ Step 7a: Equal periods extraction failed:', error);
          partialResult.errors.push('Equal periods extraction failed');
          metrics.equal = { error: error.message };
        }
        currentStep += 11;

        console.log('Step 7b: Extracting lifetime periods...');

        const todayUTC = new Date();
        const maxYouTubeDate = new Date(Date.UTC(
          todayUTC.getUTCFullYear(),
          todayUTC.getUTCMonth(),
          todayUTC.getUTCDate(),
          0, 0, 0, 0
        ));
        maxYouTubeDate.setUTCDate(maxYouTubeDate.getUTCDate() - 3);
        const maxDateStr = YTTreatmentHelper.Utils.formatDate(maxYouTubeDate);

        const lifetimeProgressCallback = progressCallback ? (subStep, totalSubSteps, desc) => {
          const overallStep = currentStep + subStep;
          progressCallback(overallStep, totalSteps, `[Lifetime] ${desc}`);
        } : null;

        try {
          const lifetimeResult = await YTTreatmentHelper.API.extractPrePostMetrics(
            YTTreatmentHelper.Utils.formatDate(videoPublishDate),
            treatmentDateYYYYMMDD,
            treatmentDateYYYYMMDD,
            maxDateStr,
            (status) => console.log(`  [Lifetime] ${status}`),
            false,
            lifetimeProgressCallback
          );
          console.log('✅ Step 7b: Lifetime periods extracted:', lifetimeResult);
          metrics.lifetime = lifetimeResult;
          metricsExtracted = true;
        } catch (error) {
          console.error('❌ Step 7b: Lifetime periods extraction failed:', error);
          partialResult.errors.push('Lifetime periods extraction failed');
          metrics.lifetime = { error: error.message };
        }
        currentStep += 6;

      } else if (extractionMode === 'equal-periods') {
        console.log('Step 7: Extracting equal periods...');

        const extractProgressCallback = progressCallback ? (subStep, totalSubSteps, desc) => {
          const overallStep = currentStep + subStep;
          progressCallback(overallStep, totalSteps, desc);
        } : null;

        const result = await YTTreatmentHelper.API.extractPrePostMetrics(
          dateRanges.pre.start,
          dateRanges.pre.end,
          dateRanges.post.start,
          dateRanges.post.end,
          (status) => console.log(`  ${status}`),
          true,
          extractProgressCallback
        );
        console.log('✅ Step 7: Equal periods extracted:', result);
        currentStep += 11;
        metrics = { mode: 'equal-periods', ...result };
        metricsExtracted = true;

      } else if (extractionMode === 'lifetime') {
        console.log('Step 7: Extracting lifetime periods...');

        const todayUTC = new Date();
        const maxYouTubeDate = new Date(Date.UTC(
          todayUTC.getUTCFullYear(),
          todayUTC.getUTCMonth(),
          todayUTC.getUTCDate(),
          0, 0, 0, 0
        ));
        maxYouTubeDate.setUTCDate(maxYouTubeDate.getUTCDate() - 3);
        const maxDateStr = YTTreatmentHelper.Utils.formatDate(maxYouTubeDate);

        const extractProgressCallback = progressCallback ? (subStep, totalSubSteps, desc) => {
          const overallStep = currentStep + subStep;
          progressCallback(overallStep, totalSteps, desc);
        } : null;

        const result = await YTTreatmentHelper.API.extractPrePostMetrics(
          YTTreatmentHelper.Utils.formatDate(videoPublishDate),
          treatmentDateYYYYMMDD,
          treatmentDateYYYYMMDD,
          maxDateStr,
          (status) => console.log(`  ${status}`),
          false,
          extractProgressCallback
        );
        console.log('✅ Step 7: Lifetime periods extracted:', result);
        currentStep += 6;
        metrics = { mode: 'lifetime', ...result };
        metricsExtracted = true;
      }
    } catch (error) {
      console.error('❌ Step 7: Metrics extraction failed:', error);
      partialResult.errors.push(`Metrics extraction failed: ${error.message}`);
    }

    // Store metrics and determine final status
    partialResult.metrics = metrics;

    // Extract date ranges from metrics for export
    let exportDateRanges = null;
    if (metrics.mode === 'complete' && metrics.equal?.periods) {
      exportDateRanges = {
        pre: metrics.equal.periods.pre,
        post: metrics.equal.periods.post
      };
    } else if (metrics.periods) {
      exportDateRanges = {
        pre: metrics.periods.pre,
        post: metrics.periods.post
      };
    }
    partialResult.dateRanges = exportDateRanges;

    // Determine final status
    if (partialResult.errors.length === 0 && metricsExtracted) {
      partialResult.status = 'success';
      console.log(`✅ EXTRACTION COMPLETE: ${video.videoId}\n`);
    } else if (metricsExtracted) {
      partialResult.status = 'partial';
      console.log(`⚠️ EXTRACTION PARTIAL: ${video.videoId} (${partialResult.errors.length} errors)\n`);
    } else {
      partialResult.status = 'error';
      console.log(`❌ EXTRACTION FAILED: ${video.videoId}\n`);
    }

    if (progressCallback) progressCallback(totalSteps, totalSteps, 'Extraction complete');

    return partialResult;
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

    // Calculate summary counts
    let successCount = 0;
    let partialCount = 0;
    let errorCount = 0;

    for (const result of this.batchResults) {
      if (result.status === 'success') successCount++;
      else if (result.status === 'partial') partialCount++;
      else errorCount++;
    }

    // Update summary card
    const summarySuccess = document.getElementById('batch-summary-success');
    const summaryPartial = document.getElementById('batch-summary-partial');
    const summaryError = document.getElementById('batch-summary-error');

    if (summarySuccess) summarySuccess.textContent = successCount;
    if (summaryPartial) summaryPartial.textContent = partialCount;
    if (summaryError) summaryError.textContent = errorCount;

    // Update problems header
    const problemsCount = partialCount + errorCount;
    const problemsCountSpan = document.getElementById('batch-problems-count');
    const totalCountSpan = document.getElementById('batch-total-count');

    if (problemsCountSpan) problemsCountSpan.textContent = problemsCount;
    if (totalCountSpan) totalCountSpan.textContent = this.batchResults.length;

    // Add rows for each result
    for (const result of this.batchResults) {
      const row = document.createElement('tr');
      // Use appropriate class based on status
      if (result.status === 'success') {
        row.className = 'success';
        row.dataset.filterStatus = 'success'; // For filtering
      } else if (result.status === 'partial') {
        row.className = 'warning';
        row.dataset.filterStatus = 'problem';
      } else {
        row.className = 'error';
        row.dataset.filterStatus = 'problem';
      }

      const videoCell = document.createElement('td');
      videoCell.innerHTML = `
        <div class="video-info">
          <div class="video-title">${result.videoTitle || result.videoId}</div>
          <div class="video-id">${result.videoId}</div>
        </div>
      `;

      const statusCell = document.createElement('td');
      if (result.status === 'success') {
        statusCell.textContent = '✓ Success';
      } else if (result.status === 'partial') {
        statusCell.textContent = '⚠ Partial';
      } else {
        statusCell.textContent = '✗ Error';
      }
      statusCell.className = `status-${result.status}`;

      const metricsCell = document.createElement('td');
      if (result.status === 'success') {
        metricsCell.textContent = `${result.metrics?.mode || 'unknown'} extracted`;
      } else if (result.status === 'partial') {
        metricsCell.textContent = result.errors?.join(', ') || 'Some fields missing';
      } else {
        metricsCell.textContent = result.errors?.join(', ') || result.error || 'Unknown error';
      }

      row.appendChild(videoCell);
      row.appendChild(statusCell);
      row.appendChild(metricsCell);

      tbody.appendChild(row);
    }

    // Initially hide successful rows (show only problems)
    this.showOnlyProblems = true;
    this.applyResultsFilter();

    resultsSection.style.display = 'block';

    // Hide progress and status when showing results
    const progressContainer = document.getElementById('batch-progress-container');
    const statusDiv = document.getElementById('batch-status');
    if (progressContainer) progressContainer.style.display = 'none';
    if (statusDiv) statusDiv.style.display = 'none';

    // Set up toggle button
    const toggleBtn = document.getElementById('batch-toggle-all-btn');
    if (toggleBtn) {
      toggleBtn.onclick = () => this.toggleResultsFilter();
    }

    // Check if buttons exist
    const copyBtn = document.getElementById('batch-copy-btn');
    const downloadBtn = document.getElementById('batch-download-btn');
    console.log('Export buttons:', { copyBtn: !!copyBtn, downloadBtn: !!downloadBtn });

    // Scroll to bottom to show export buttons
    // Wait longer to ensure DOM is fully rendered
    setTimeout(() => {
      const helperBody = document.querySelector('.helper-body');
      if (helperBody) {
        // Force scroll to absolute bottom
        helperBody.scrollTo({
          top: helperBody.scrollHeight + 1000, // Add extra to ensure we reach the bottom
          behavior: 'smooth'
        });
        console.log('Scrolled to bottom. scrollHeight:', helperBody.scrollHeight);
      }
    }, 300);

    console.log(`✅ Results displayed: ${this.batchResults.length} videos (${problemsCount} need attention)`);
  },

  /**
   * Apply filter to show/hide table rows based on status
   */
  applyResultsFilter: function() {
    const tbody = document.getElementById('batch-results-tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      if (this.showOnlyProblems) {
        // Hide success rows, show problem rows
        if (row.dataset.filterStatus === 'success') {
          row.style.display = 'none';
        } else {
          row.style.display = '';
        }
      } else {
        // Show all rows
        row.style.display = '';
      }
    });
  },

  /**
   * Toggle between showing all results and showing only problems
   */
  toggleResultsFilter: function() {
    this.showOnlyProblems = !this.showOnlyProblems;
    this.applyResultsFilter();

    // Update toggle button text
    const toggleBtn = document.getElementById('batch-toggle-all-btn');
    const totalCountSpan = document.getElementById('batch-total-count');

    if (toggleBtn) {
      if (this.showOnlyProblems) {
        toggleBtn.innerHTML = `Show all ${totalCountSpan?.textContent || this.batchResults.length} videos ▼`;
      } else {
        toggleBtn.innerHTML = `Show problems only ▲`;
      }
    }
  },

  /**
   * Copy results to clipboard as TSV (without headers)
   */
  copyResultsToClipboard: async function() {
    const tsv = this.formatResultsAsTSVWithoutHeaders();

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
   * Format results as TSV WITHOUT headers (for clipboard copy)
   * Returns string with only data rows, no header row
   */
  formatResultsAsTSVWithoutHeaders: function() {
    if (this.batchResults.length === 0) {
      return '';
    }

    // Determine format based on first result's extraction mode
    const firstResult = this.batchResults[0];
    const mode = firstResult.metrics?.mode;

    if (mode === 'complete') {
      return this.formatCompleteAnalysisTSVWithoutHeaders();
    } else if (mode === 'equal-periods') {
      return this.formatEqualPeriodsTSVWithoutHeaders();
    } else if (mode === 'lifetime') {
      return this.formatLifetimeTSVWithoutHeaders();
    } else {
      // Fallback format
      return this.formatBasicTSVWithoutHeaders();
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
      'Publish Date',
      'Treatment Date',
      'Equal Pre Period',
      'Equal Post Period',
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
      'Lifetime Pre Period',
      'Lifetime Post Period',
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
      const equal = result.metrics?.equal || {};
      const lifetime = result.metrics?.lifetime || {};

      // Helper to get error placeholder
      const getErrorValue = (value) => {
        if (result.status === 'error' || result.status === 'partial') {
          return value || 'ERROR';
        }
        return value || '';
      };

      // Build date period strings
      const equalPrePeriod = result.dateRanges?.pre ?
        `${this.formatDateForExport(result.dateRanges.pre.start)}-${this.formatDateForExport(result.dateRanges.pre.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');
      const equalPostPeriod = result.dateRanges?.post ?
        `${this.formatDateForExport(result.dateRanges.post.start)}-${this.formatDateForExport(result.dateRanges.post.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');

      const lifetimePrePeriod = lifetime.periods?.pre ?
        `${this.formatDateForExport(lifetime.periods.pre.start)}-${this.formatDateForExport(lifetime.periods.pre.end)}` :
        (result.status !== 'success' && result.metrics?.mode === 'complete' ? 'ERROR' : '');
      const lifetimePostPeriod = lifetime.periods?.post ?
        `${this.formatDateForExport(lifetime.periods.post.start)}-${this.formatDateForExport(lifetime.periods.post.end)}` :
        (result.status !== 'success' && result.metrics?.mode === 'complete' ? 'ERROR' : '');

      const row = [
        result.url || '',
        result.videoTitle || (result.status !== 'success' ? 'ERROR: ' + (result.errors?.join('; ') || 'Unknown error') : ''),
        result.videoId || '',
        result.publishDate || (result.status !== 'success' ? 'ERROR' : ''),
        result.treatmentDate || '',
        equalPrePeriod,
        equalPostPeriod,
        getErrorValue(equal.pre?.impressions),
        getErrorValue(equal.post?.impressions),
        getErrorValue(equal.pre?.ctr),
        getErrorValue(equal.post?.ctr),
        getErrorValue(equal.pre?.views),
        getErrorValue(equal.post?.views),
        getErrorValue(equal.pre?.awt),
        getErrorValue(equal.post?.awt),
        getErrorValue(this.getRetentionValue(equal.pre?.retention)),
        getErrorValue(this.getRetentionValue(equal.post?.retention)),
        getErrorValue(this.getStayedToWatchValue(equal.pre?.stayedToWatch, equal.pre?.retention)),
        getErrorValue(this.getStayedToWatchValue(equal.post?.stayedToWatch, equal.post?.retention)),
        lifetimePrePeriod,
        lifetimePostPeriod,
        getErrorValue(lifetime.pre?.impressions),
        getErrorValue(lifetime.post?.impressions),
        getErrorValue(lifetime.pre?.ctr),
        getErrorValue(lifetime.post?.ctr),
        getErrorValue(lifetime.pre?.views),
        getErrorValue(lifetime.post?.views),
        getErrorValue(lifetime.pre?.awt),
        getErrorValue(lifetime.post?.awt)
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
      'Publish Date',
      'Treatment Date',
      'Pre Period',
      'Post Period',
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
      // Helper to get error placeholder
      const getErrorValue = (value) => {
        if (result.status === 'error' || result.status === 'partial') {
          return value || 'ERROR';
        }
        return value || '';
      };

      // Build date period strings
      const prePeriod = result.dateRanges?.pre ?
        `${this.formatDateForExport(result.dateRanges.pre.start)}-${this.formatDateForExport(result.dateRanges.pre.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');
      const postPeriod = result.dateRanges?.post ?
        `${this.formatDateForExport(result.dateRanges.post.start)}-${this.formatDateForExport(result.dateRanges.post.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');

      const row = [
        result.url || '',
        result.videoTitle || (result.status !== 'success' ? 'ERROR: ' + (result.errors?.join('; ') || 'Unknown error') : ''),
        result.videoId || '',
        result.publishDate || (result.status !== 'success' ? 'ERROR' : ''),
        result.treatmentDate || '',
        prePeriod,
        postPeriod,
        getErrorValue(result.metrics?.pre?.impressions),
        getErrorValue(result.metrics?.post?.impressions),
        getErrorValue(result.metrics?.pre?.ctr),
        getErrorValue(result.metrics?.post?.ctr),
        getErrorValue(result.metrics?.pre?.views),
        getErrorValue(result.metrics?.post?.views),
        getErrorValue(result.metrics?.pre?.awt),
        getErrorValue(result.metrics?.post?.awt),
        getErrorValue(this.getRetentionValue(result.metrics?.pre?.retention)),
        getErrorValue(this.getRetentionValue(result.metrics?.post?.retention)),
        getErrorValue(this.getStayedToWatchValue(result.metrics?.pre?.stayedToWatch, result.metrics?.pre?.retention)),
        getErrorValue(this.getStayedToWatchValue(result.metrics?.post?.stayedToWatch, result.metrics?.post?.retention))
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
      'Publish Date',
      'Treatment Date',
      'Pre Period',
      'Post Period',
      'Pre Impressions',
      'Post Impressions',
      'Pre CTR',
      'Post CTR',
      'Pre Views',
      'Post Views',
      'Pre AWT',
      'Post AWT'
    ];

    const rows = [headers.join('\t')];

    for (const result of this.batchResults) {
      // Helper to get error placeholder
      const getErrorValue = (value) => {
        if (result.status === 'error' || result.status === 'partial') {
          return value || 'ERROR';
        }
        return value || '';
      };

      // Build date period strings
      const prePeriod = result.dateRanges?.pre ?
        `${this.formatDateForExport(result.dateRanges.pre.start)}-${this.formatDateForExport(result.dateRanges.pre.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');
      const postPeriod = result.dateRanges?.post ?
        `${this.formatDateForExport(result.dateRanges.post.start)}-${this.formatDateForExport(result.dateRanges.post.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');

      const row = [
        result.url || '',
        result.videoTitle || (result.status !== 'success' ? 'ERROR: ' + (result.errors?.join('; ') || 'Unknown error') : ''),
        result.videoId || '',
        result.publishDate || (result.status !== 'success' ? 'ERROR' : ''),
        result.treatmentDate || '',
        prePeriod,
        postPeriod,
        getErrorValue(result.metrics?.pre?.impressions),
        getErrorValue(result.metrics?.post?.impressions),
        getErrorValue(result.metrics?.pre?.ctr),
        getErrorValue(result.metrics?.post?.ctr),
        getErrorValue(result.metrics?.pre?.views),
        getErrorValue(result.metrics?.post?.views),
        getErrorValue(result.metrics?.pre?.awt),
        getErrorValue(result.metrics?.post?.awt)
      ];

      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  },

  /**
   * Format basic results (fallback)
   */
  formatBasicTSV: function() {
    const headers = ['URL', 'Video Title', 'Video ID', 'Publish Date', 'Status', 'Treatment Date'];
    const rows = [headers.join('\t')];

    for (const result of this.batchResults) {
      const row = [
        result.url,
        result.videoTitle || '',
        result.videoId,
        result.publishDate || '',
        result.status,
        result.treatmentDate || ''
      ];
      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  },

  /**
   * Format complete analysis results WITHOUT headers
   */
  formatCompleteAnalysisTSVWithoutHeaders: function() {
    const rows = [];

    for (const result of this.batchResults) {
      const equal = result.metrics?.equal || {};
      const lifetime = result.metrics?.lifetime || {};

      // Helper to get error placeholder
      const getErrorValue = (value) => {
        if (result.status === 'error' || result.status === 'partial') {
          return value || 'ERROR';
        }
        return value || '';
      };

      // Build date period strings
      const equalPrePeriod = result.dateRanges?.pre ?
        `${this.formatDateForExport(result.dateRanges.pre.start)}-${this.formatDateForExport(result.dateRanges.pre.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');
      const equalPostPeriod = result.dateRanges?.post ?
        `${this.formatDateForExport(result.dateRanges.post.start)}-${this.formatDateForExport(result.dateRanges.post.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');

      const lifetimePrePeriod = lifetime.periods?.pre ?
        `${this.formatDateForExport(lifetime.periods.pre.start)}-${this.formatDateForExport(lifetime.periods.pre.end)}` :
        (result.status !== 'success' && result.metrics?.mode === 'complete' ? 'ERROR' : '');
      const lifetimePostPeriod = lifetime.periods?.post ?
        `${this.formatDateForExport(lifetime.periods.post.start)}-${this.formatDateForExport(lifetime.periods.post.end)}` :
        (result.status !== 'success' && result.metrics?.mode === 'complete' ? 'ERROR' : '');

      // Build row with consistent column count - fill missing values with ERROR if extraction failed
      const row = [
        result.url || '',
        result.videoTitle || (result.status !== 'success' ? 'ERROR: ' + (result.errors?.join('; ') || 'Unknown error') : ''),
        result.videoId || '',
        result.publishDate || (result.status !== 'success' ? 'ERROR' : ''),
        result.treatmentDate || '',
        equalPrePeriod,
        equalPostPeriod,
        getErrorValue(equal.pre?.impressions),
        getErrorValue(equal.post?.impressions),
        getErrorValue(equal.pre?.ctr),
        getErrorValue(equal.post?.ctr),
        getErrorValue(equal.pre?.views),
        getErrorValue(equal.post?.views),
        getErrorValue(equal.pre?.awt),
        getErrorValue(equal.post?.awt),
        getErrorValue(this.getRetentionValue(equal.pre?.retention)),
        getErrorValue(this.getRetentionValue(equal.post?.retention)),
        getErrorValue(this.getStayedToWatchValue(equal.pre?.stayedToWatch, equal.pre?.retention)),
        getErrorValue(this.getStayedToWatchValue(equal.post?.stayedToWatch, equal.post?.retention)),
        lifetimePrePeriod,
        lifetimePostPeriod,
        getErrorValue(lifetime.pre?.impressions),
        getErrorValue(lifetime.post?.impressions),
        getErrorValue(lifetime.pre?.ctr),
        getErrorValue(lifetime.post?.ctr),
        getErrorValue(lifetime.pre?.views),
        getErrorValue(lifetime.post?.views),
        getErrorValue(lifetime.pre?.awt),
        getErrorValue(lifetime.post?.awt)
      ];

      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  },

  /**
   * Format equal periods results WITHOUT headers
   */
  formatEqualPeriodsTSVWithoutHeaders: function() {
    const rows = [];

    for (const result of this.batchResults) {
      // Helper to get error placeholder
      const getErrorValue = (value) => {
        if (result.status === 'error' || result.status === 'partial') {
          return value || 'ERROR';
        }
        return value || '';
      };

      // Build date period strings
      const prePeriod = result.dateRanges?.pre ?
        `${this.formatDateForExport(result.dateRanges.pre.start)}-${this.formatDateForExport(result.dateRanges.pre.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');
      const postPeriod = result.dateRanges?.post ?
        `${this.formatDateForExport(result.dateRanges.post.start)}-${this.formatDateForExport(result.dateRanges.post.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');

      // Build row with consistent column count
      const row = [
        result.url || '',
        result.videoTitle || (result.status !== 'success' ? 'ERROR: ' + (result.errors?.join('; ') || 'Unknown error') : ''),
        result.videoId || '',
        result.publishDate || (result.status !== 'success' ? 'ERROR' : ''),
        result.treatmentDate || '',
        prePeriod,
        postPeriod,
        getErrorValue(result.metrics?.pre?.impressions),
        getErrorValue(result.metrics?.post?.impressions),
        getErrorValue(result.metrics?.pre?.ctr),
        getErrorValue(result.metrics?.post?.ctr),
        getErrorValue(result.metrics?.pre?.views),
        getErrorValue(result.metrics?.post?.views),
        getErrorValue(result.metrics?.pre?.awt),
        getErrorValue(result.metrics?.post?.awt),
        getErrorValue(this.getRetentionValue(result.metrics?.pre?.retention)),
        getErrorValue(this.getRetentionValue(result.metrics?.post?.retention)),
        getErrorValue(this.getStayedToWatchValue(result.metrics?.pre?.stayedToWatch, result.metrics?.pre?.retention)),
        getErrorValue(this.getStayedToWatchValue(result.metrics?.post?.stayedToWatch, result.metrics?.post?.retention))
      ];

      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  },

  /**
   * Format lifetime results WITHOUT headers
   */
  formatLifetimeTSVWithoutHeaders: function() {
    const rows = [];

    for (const result of this.batchResults) {
      // Helper to get error placeholder
      const getErrorValue = (value) => {
        if (result.status === 'error' || result.status === 'partial') {
          return value || 'ERROR';
        }
        return value || '';
      };

      // Build date period strings
      const prePeriod = result.dateRanges?.pre ?
        `${this.formatDateForExport(result.dateRanges.pre.start)}-${this.formatDateForExport(result.dateRanges.pre.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');
      const postPeriod = result.dateRanges?.post ?
        `${this.formatDateForExport(result.dateRanges.post.start)}-${this.formatDateForExport(result.dateRanges.post.end)}` :
        (result.status !== 'success' ? 'ERROR' : '');

      // Build row with consistent column count
      const row = [
        result.url || '',
        result.videoTitle || (result.status !== 'success' ? 'ERROR: ' + (result.errors?.join('; ') || 'Unknown error') : ''),
        result.videoId || '',
        result.publishDate || (result.status !== 'success' ? 'ERROR' : ''),
        result.treatmentDate || '',
        prePeriod,
        postPeriod,
        getErrorValue(result.metrics?.pre?.impressions),
        getErrorValue(result.metrics?.post?.impressions),
        getErrorValue(result.metrics?.pre?.ctr),
        getErrorValue(result.metrics?.post?.ctr),
        getErrorValue(result.metrics?.pre?.views),
        getErrorValue(result.metrics?.post?.views),
        getErrorValue(result.metrics?.pre?.awt),
        getErrorValue(result.metrics?.post?.awt)
      ];

      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  },

  /**
   * Format basic results WITHOUT headers (fallback)
   */
  formatBasicTSVWithoutHeaders: function() {
    const rows = [];

    for (const result of this.batchResults) {
      const row = [
        result.url,
        result.videoTitle || '',
        result.videoId,
        result.publishDate || '',
        result.status,
        result.treatmentDate || ''
      ];
      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  },

  /**
   * Initialize batch history UI
   */
  initBatchHistory: function() {
    const toggleBtn = document.getElementById('toggle-batch-history-btn');
    const historyContent = document.getElementById('batch-history-content');
    const clearBtn = document.getElementById('clear-batch-history-btn');

    if (!toggleBtn || !historyContent) return;

    // Toggle history visibility
    toggleBtn.addEventListener('click', async () => {
      const isVisible = historyContent.style.display !== 'none';

      if (isVisible) {
        historyContent.style.display = 'none';
        toggleBtn.textContent = 'Show History';
      } else {
        // Load and display history
        await this.loadAndDisplayBatchHistory();
        historyContent.style.display = 'block';
        toggleBtn.textContent = 'Hide History';
      }
    });

    // Clear history
    clearBtn.addEventListener('click', async () => {
      if (confirm('Clear all batch extraction history?')) {
        await YTTreatmentHelper.ExtractionHistory.clearHistory({ type: 'batch' });
        await this.loadAndDisplayBatchHistory();
      }
    });
  },

  /**
   * Load and display batch history
   */
  loadAndDisplayBatchHistory: async function() {
    const historyList = document.getElementById('batch-history-list');
    const historySection = document.getElementById('batch-history-section');

    if (!historyList) return;

    // Get batch history
    const history = await YTTreatmentHelper.ExtractionHistory.getBatchHistory();

    if (history.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No batch extraction history</div>';
      return;
    }

    // Show history section
    historySection.style.display = 'block';

    // Build history HTML
    let html = '';
    history.forEach((entry, index) => {
      const modeLabel = entry.mode === 'equal-periods' ? 'Equal Periods' :
                        entry.mode === 'lifetime' ? 'Lifetime' : 'Complete Analysis';

      html += `
        <div class="history-item" data-entry-id="${entry.id}">
          <div class="history-item-header">
            <div class="history-item-info">
              <span class="history-item-date">${YTTreatmentHelper.ExtractionHistory.formatExtractionDate(entry.extractionDate)}</span>
              <span class="history-item-mode">${modeLabel} • ${entry.videoCount} videos</span>
            </div>
            <button class="history-item-toggle" data-index="${index}">
              <span class="toggle-icon">▼</span>
            </button>
          </div>
          <div class="history-item-meta">
            Treatment: ${entry.treatmentDate}
          </div>
          <div class="history-item-details" style="display: none;">
            <div class="batch-history-videos">
              ${entry.results.slice(0, 5).map(r => `
                <div class="batch-history-video">
                  <div class="batch-history-video-title">${r.videoTitle || r.videoId}</div>
                  <div class="batch-history-video-id">${r.videoId}</div>
                </div>
              `).join('')}
              ${entry.results.length > 5 ? `<div class="batch-history-more">+ ${entry.results.length - 5} more videos</div>` : ''}
            </div>
            <div class="history-actions">
              <button class="history-copy-btn" data-entry-id="${entry.id}">
                <span class="btn-icon">📋</span> Copy All Data
              </button>
            </div>
          </div>
        </div>
      `;
    });

    historyList.innerHTML = html;

    // Add toggle event listeners
    document.querySelectorAll('.history-item-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const historyItem = e.target.closest('.history-item');
        const details = historyItem.querySelector('.history-item-details');
        const icon = btn.querySelector('.toggle-icon');

        if (details.style.display === 'none') {
          details.style.display = 'block';
          icon.textContent = '▲';
        } else {
          details.style.display = 'none';
          icon.textContent = '▼';
        }
      });
    });

    // Add copy event listeners
    document.querySelectorAll('.history-copy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const entryId = parseInt(btn.dataset.entryId);
        const entry = history.find(e => e.id === entryId);

        if (entry) {
          // Use the existing batch export format
          const tsv = this.formatBatchResultsForExport(entry.results, entry.mode);
          await navigator.clipboard.writeText(tsv);

          // Visual feedback
          const originalText = btn.innerHTML;
          btn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
          btn.classList.add('copied');

          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('copied');
          }, 1500);
        }
      });
    });
  },

  /**
   * Helper to format batch results for export (used by history too)
   */
  formatBatchResultsForExport: function(results, mode) {
    // Simplified export format for history (no URL/Video ID columns)
    const rows = [];

    for (const result of results) {
      if (result.status !== 'success') continue;

      // Build date period strings
      const prePeriod = result.dateRanges?.pre ?
        `${this.formatDateForExport(result.dateRanges.pre.start)}-${this.formatDateForExport(result.dateRanges.pre.end)}` : '';
      const postPeriod = result.dateRanges?.post ?
        `${this.formatDateForExport(result.dateRanges.post.start)}-${this.formatDateForExport(result.dateRanges.post.end)}` : '';

      const row = [
        result.videoTitle || '',
        result.treatmentDate || '',
        prePeriod,
        postPeriod,
        result.metrics?.pre?.impressions || '',
        result.metrics?.post?.impressions || '',
        '',
        result.metrics?.pre?.ctr || '',
        result.metrics?.post?.ctr || '',
        '',
        result.metrics?.pre?.awt || '',
        result.metrics?.post?.awt || '',
        this.getRetentionValue(result.metrics?.pre?.retention),
        this.getRetentionValue(result.metrics?.post?.retention),
        this.getStayedToWatchValue(result.metrics?.pre?.stayedToWatch, result.metrics?.pre?.retention),
        this.getStayedToWatchValue(result.metrics?.post?.stayedToWatch, result.metrics?.post?.retention),
        result.metrics?.pre?.views || '',
        result.metrics?.post?.views || ''
      ];
      rows.push(row.join('\t'));
    }

    return rows.join('\n');
  }
};

console.log('Batch mode module loaded');
