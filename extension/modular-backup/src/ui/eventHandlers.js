/**
 * Event handlers for UI interactions
 */

import { calculateDateRanges, formatDateDisplay } from '../utils/dateHelpers.js';
import { copyToClipboard } from '../utils/domHelpers.js';
import { safeStorage } from '../utils/storageHelpers.js';
import { getVideoPublishDate } from '../core/validation.js';
import { navigateToAnalyticsTab, navigateToAdvancedMode } from '../core/navigation.js';
import { extractPrePostMetrics, selectMetrics } from '../core/extraction.js';
import { SELECTORS, TIMEOUTS, MESSAGES } from '../config/constants.js';
import { formatDate } from '../utils/dateHelpers.js';

/**
 * Handle Calculate button click
 */
async function handleCalculateButton() {
  const treatmentDate = document.getElementById('treatment-date').value;

  if (!treatmentDate) {
    alert('Please select a treatment date');
    return;
  }

  // Navigate to Analytics tab first
  try {
    await navigateToAnalyticsTab();
  } catch (error) {
    console.warn('Could not navigate to Analytics tab:', error);
  }

  await new Promise(resolve => setTimeout(resolve, TIMEOUTS.MEDIUM));

  // Get publish date
  const videoPublishDate = getVideoPublishDate();

  if (videoPublishDate) {
    console.log(`✅ Video publish date detected: ${formatDate(videoPublishDate)}`);

    // Set minimum date for treatment date picker
    const treatmentDateInput = document.getElementById('treatment-date');
    const publishDateStr = formatDate(videoPublishDate);
    treatmentDateInput.setAttribute('min', publishDateStr);
    console.log(`Set treatment date minimum to: ${publishDateStr}`);
  } else {
    console.warn(MESSAGES.WARNINGS.NO_PUBLISH_DATE);
  }

  // Validate treatment date
  const errorEl = document.getElementById('treatment-error');
  const warningEl = document.getElementById('period-warning');
  const extractBtn = document.getElementById('auto-extract-btn');

  if (videoPublishDate) {
    const treatment = new Date(treatmentDate);
    const publish = new Date(videoPublishDate);
    treatment.setHours(0, 0, 0, 0);
    publish.setHours(0, 0, 0, 0);

    if (treatment < publish) {
      console.error(`❌ Invalid: Treatment date ${formatDate(treatment)} is before publish date ${formatDate(publish)}`);

      errorEl.style.display = 'block';
      warningEl.style.display = 'none';
      extractBtn.disabled = true;
      extractBtn.classList.add('disabled');

      document.getElementById('results-section').style.display = 'block';
      document.getElementById('pre-start').value = '';
      document.getElementById('pre-end').value = '';
      document.getElementById('pre-days').textContent = '—';
      document.getElementById('post-start').value = treatmentDate;
      document.getElementById('post-end').value = '';
      document.getElementById('post-days').textContent = '—';

      document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
  }

  // Valid treatment date
  errorEl.style.display = 'none';
  extractBtn.disabled = false;
  extractBtn.classList.remove('disabled');

  let ranges;
  try {
    ranges = calculateDateRanges(treatmentDate, videoPublishDate);
  } catch (error) {
    alert(error.message);
    return;
  }

  // Display results
  document.getElementById('pre-start').value = ranges.pre.start;
  document.getElementById('pre-start').dataset.original = ranges.pre.start;
  document.getElementById('pre-end').value = ranges.pre.end;
  document.getElementById('pre-end').dataset.original = ranges.pre.end;
  document.getElementById('pre-days').textContent = ranges.pre.days;

  document.getElementById('post-start').value = ranges.post.start;
  document.getElementById('post-start').dataset.original = ranges.post.start;
  document.getElementById('post-end').value = ranges.post.end;
  document.getElementById('post-end').dataset.original = ranges.post.end;
  document.getElementById('post-days').textContent = ranges.post.days;

  // Show warning if periods different
  if (ranges.pre.days !== ranges.post.days) {
    const warningMsg = `⚠️ Note: PRE period (${ranges.pre.days} days) is shorter than POST period (${ranges.post.days} days) because the video was published on ${formatDateDisplay(ranges.videoPublishDate)}. The PRE period cannot start before the video was published.`;
    console.warn(warningMsg);
    warningEl.style.display = 'block';
  } else {
    warningEl.style.display = 'none';
  }

  document.getElementById('results-section').style.display = 'block';
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Save to storage
  await safeStorage.set({
    lastTreatmentDate: treatmentDate,
    lastCalculatedRanges: ranges,
    videoPublishDate: videoPublishDate ? formatDate(videoPublishDate) : null
  });
}

/**
 * Handle Extract Metrics button click
 */
async function handleExtractButton() {
  const preStart = document.getElementById('pre-start').value;
  const preEnd = document.getElementById('pre-end').value;
  const postStart = document.getElementById('post-start').value;
  const postEnd = document.getElementById('post-end').value;
  const preDays = parseInt(document.getElementById('pre-days').textContent);
  const postDays = parseInt(document.getElementById('post-days').textContent);

  if (!preStart || !postStart) {
    alert('Please calculate date ranges first');
    return;
  }

  const extractBtn = document.getElementById('auto-extract-btn');
  const cancelBtn = document.getElementById('cancel-extract-btn');
  const progressContainer = document.getElementById('progress-container');

  extractBtn.style.display = 'none';
  cancelBtn.style.display = 'inline-block';
  progressContainer.style.display = 'block';

  try {
    // Navigate to advanced mode
    await navigateToAdvancedMode();

    // Select metrics
    await selectMetrics();

    // Extract metrics
    const results = await extractPrePostMetrics(
      { start: preStart, end: preEnd, days: preDays },
      { start: postStart, end: postEnd, days: postDays }
    );

    // Display results
    document.getElementById('pre-views').textContent = results.pre.views || '—';
    document.getElementById('post-views').textContent = results.post.views || '—';
    document.getElementById('pre-awt').textContent = results.pre.awt || '—';
    document.getElementById('post-awt').textContent = results.post.awt || '—';
    document.getElementById('pre-ctr').textContent = results.pre.ctr || '—';
    document.getElementById('post-ctr').textContent = results.post.ctr || '—';

    document.getElementById('metrics-results').style.display = 'block';

    // Save results
    await safeStorage.set({ lastExtractedMetrics: results });

  } catch (error) {
    console.error('Extraction error:', error);
    alert(`Extraction failed: ${error.message}`);
  } finally {
    extractBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'none';
    progressContainer.style.display = 'none';
  }
}

/**
 * Handle Copy button clicks
 */
function handleCopyButton(event) {
  const metric = event.target.dataset.metric;
  if (!metric) return;

  const preValue = document.getElementById(`pre-${metric}`).textContent;
  const postValue = document.getElementById(`post-${metric}`).textContent;

  const text = `PRE: ${preValue}\nPOST: ${postValue}`;

  copyToClipboard(text).then(success => {
    if (success) {
      event.target.textContent = 'Copied!';
      event.target.classList.add('copied');
      setTimeout(() => {
        event.target.textContent = 'Copy';
        event.target.classList.remove('copied');
      }, 2000);
    }
  });
}

/**
 * Handle Copy All button click
 */
function handleCopyAllButton() {
  const metrics = ['views', 'awt', 'ctr'];
  const lines = metrics.map(metric => {
    const pre = document.getElementById(`pre-${metric}`).textContent;
    const post = document.getElementById(`post-${metric}`).textContent;
    return `${metric.toUpperCase()}: PRE=${pre}, POST=${post}`;
  });

  const text = lines.join('\n');

  const button = document.getElementById('copy-all-btn');
  copyToClipboard(text).then(success => {
    if (success) {
      button.textContent = 'Copied All!';
      setTimeout(() => {
        button.textContent = 'Copy All';
      }, 2000);
    }
  });
}

/**
 * Setup all event handlers
 */
export function setupEventHandlers() {
  // Close button
  document.getElementById('helper-close').addEventListener('click', async () => {
    const panel = document.getElementById(SELECTORS.PANEL);
    panel.style.display = 'none';
    await safeStorage.set({ panelVisible: false });
  });

  // Calculate button
  document.getElementById('calculate-btn').addEventListener('click', handleCalculateButton);

  // Extract button
  document.getElementById('auto-extract-btn').addEventListener('click', handleExtractButton);

  // Edit dates button
  const panel = document.getElementById(SELECTORS.PANEL);
  panel.addEventListener('click', (e) => {
    const editBtn = e.target.closest('#edit-dates-btn');
    if (editBtn) {
      const dateInputs = panel.querySelectorAll('.date-edit');
      const isEditing = dateInputs[0].disabled === false;

      dateInputs.forEach(input => {
        input.disabled = !isEditing;
      });

      editBtn.textContent = isEditing ? 'Edit' : 'Save';

      if (isEditing) {
        // Save was clicked
        const preDays = Math.floor(
          (new Date(document.getElementById('pre-end').value) -
           new Date(document.getElementById('pre-start').value)) /
          (1000 * 60 * 60 * 24)
        ) + 1;

        const postDays = Math.floor(
          (new Date(document.getElementById('post-end').value) -
           new Date(document.getElementById('post-start').value)) /
          (1000 * 60 * 60 * 24)
        ) + 1;

        document.getElementById('pre-days').textContent = preDays;
        document.getElementById('post-days').textContent = postDays;
      }
    }
  });

  // Copy buttons
  panel.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-btn')) {
      handleCopyButton(e);
    }
  });

  // Copy all button
  panel.addEventListener('click', (e) => {
    if (e.target.id === 'copy-all-btn') {
      handleCopyAllButton();
    }
  });
}
