/**
 * YouTube Treatment Comparison Helper - Content Script
 * Phase 1: Manual Helper - Calculate date ranges and display them
 */

// Check if extension context is still valid
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

// Safe chrome.storage wrapper with error handling
const safeStorage = {
  get: async (keys) => {
    if (!isExtensionContextValid()) {
      console.warn('Extension context invalidated. Please reload the page.');
      return {};
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            console.warn('Storage get error:', chrome.runtime.lastError);
            resolve({});
          } else {
            resolve(result);
          }
        });
      } catch (e) {
        console.warn('Storage get exception:', e);
        resolve({});
      }
    });
  },

  set: async (data) => {
    if (!isExtensionContextValid()) {
      console.warn('Extension context invalidated. Cannot save data.');
      return false;
    }

    return new Promise((resolve) => {
      try {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            console.warn('Storage set error:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      } catch (e) {
        console.warn('Storage set exception:', e);
        resolve(false);
      }
    });
  }
};

// Utility: Format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Core Logic: Calculate PRE and POST date ranges
function calculateDateRanges(treatmentDate) {
  const treatment = new Date(treatmentDate);
  const today = new Date();

  // Calculate days since treatment
  const daysSince = Math.floor((today - treatment) / (1000 * 60 * 60 * 24));

  // PRE period: Same number of days BEFORE treatment
  const preStart = new Date(treatment);
  preStart.setDate(preStart.getDate() - daysSince);
  const preEnd = new Date(treatment);
  preEnd.setDate(preEnd.getDate() - 1); // Day before treatment

  // POST period: Treatment day to today
  const postStart = new Date(treatment);
  const postEnd = new Date(today);

  return {
    daysSince: daysSince,
    pre: {
      start: formatDate(preStart),
      end: formatDate(preEnd),
      days: daysSince
    },
    post: {
      start: formatDate(postStart),
      end: formatDate(postEnd),
      days: daysSince + 1 // Including treatment day
    }
  };
}

// ============================================================
// PHASE 2: AUTOMATIC METRICS EXTRACTION
// ============================================================

// Helper: Set Custom Date Range
async function setCustomDateRange(startDate, endDate) {
  console.log(`Setting date range: ${startDate} to ${endDate}`);

  const sidebar = document.querySelector('yta-explore-sidebar');
  if (!sidebar) throw new Error('Sidebar not found');

  const triggers = sidebar.querySelectorAll('ytcp-dropdown-trigger');
  let dateTrigger = null;

  for (const trigger of triggers) {
    const text = trigger.textContent;
    if (text.includes('–') || text.includes('Since') || text.includes('days')) {
      dateTrigger = trigger;
      break;
    }
  }

  if (!dateTrigger) throw new Error('Date trigger not found');

  dateTrigger.click();
  await new Promise(resolve => setTimeout(resolve, 500));

  const customOption = document.querySelector('tp-yt-paper-item[test-id="fixed"]');
  if (!customOption) throw new Error('Custom option not found');

  customOption.click();
  await new Promise(resolve => setTimeout(resolve, 800));

  const dateDialog = document.querySelector('ytcp-date-period-picker');
  if (!dateDialog) throw new Error('Date picker not found');

  const startInput = dateDialog.querySelector('#start-date input');
  const endInput = dateDialog.querySelector('#end-date input');

  if (!startInput || !endInput) throw new Error('Input elements not found');

  // Detect date format based on browser locale
  const useDDMMYYYY = () => {
    const locale = navigator.language || 'en-US';
    // Countries that use DD/MM/YYYY: India, UK, Australia, most of Europe, etc.
    const ddmmCountries = ['en-IN', 'en-GB', 'en-AU', 'en-NZ', 'en-ZA', 'hi-IN',
                           'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru'];
    return ddmmCountries.some(country => locale.startsWith(country.split('-')[0]));
  };

  const formatDateForInput = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    // Use DD/MM/YYYY for India and most non-US countries
    if (useDDMMYYYY()) {
      return `${day}/${month}/${year}`;
    }
    // Use MM/DD/YYYY for US
    return `${month}/${day}/${year}`;
  };

  const formattedStart = formatDateForInput(startDate);
  const formattedEnd = formatDateForInput(endDate);

  // Log format being used for debugging
  const locale = navigator.language || 'en-US';
  const format = useDDMMYYYY() ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
  console.log(`Using date format: ${format} (detected locale: ${locale})`);
  console.log(`Setting dates: ${formattedStart} to ${formattedEnd}`);

  startInput.value = formattedStart;
  startInput.dispatchEvent(new Event('input', { bubbles: true }));
  startInput.dispatchEvent(new Event('change', { bubbles: true }));

  await new Promise(resolve => setTimeout(resolve, 200));

  endInput.value = formattedEnd;
  endInput.dispatchEvent(new Event('input', { bubbles: true }));
  endInput.dispatchEvent(new Event('change', { bubbles: true }));

  await new Promise(resolve => setTimeout(resolve, 300));

  const applyButton = dateDialog.querySelector('#apply-button');
  if (!applyButton) throw new Error('Apply button not found');

  applyButton.click();
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log(`Date range set: ${formattedStart} - ${formattedEnd}`);
}

// Helper: Select Metrics
async function selectMetrics() {
  console.log('Selecting metrics...');

  const metricsToSelect = [
    'EXTERNAL_VIEWS',
    'AVERAGE_WATCH_TIME',
    'AVERAGE_WATCH_PERCENTAGE',
    'VIDEO_THUMBNAIL_IMPRESSIONS_VTR'
  ];

  const metricPicker = document.querySelector('#metric-picker');
  if (!metricPicker) throw new Error('Metric picker not found');

  const trigger = metricPicker.querySelector('ytcp-dropdown-trigger');
  if (!trigger) throw new Error('Metric trigger not found');

  trigger.click();
  await new Promise(resolve => setTimeout(resolve, 1000));

  const dialog = document.querySelector('tp-yt-paper-dialog[aria-label="Metrics"]');
  if (!dialog) throw new Error('Metrics dialog not found');

  const deselectButton = dialog.querySelector('#deselect-all-button');
  if (deselectButton) {
    deselectButton.click();
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  for (const metricId of metricsToSelect) {
    const checkbox = dialog.querySelector(`ytcp-checkbox-lit#${metricId}`);
    if (!checkbox) continue;

    const checkboxDiv = checkbox.querySelector('[role="checkbox"]');
    if (checkboxDiv && checkboxDiv.getAttribute('aria-checked') === 'false') {
      checkboxDiv.click();
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  const applyButton = dialog.querySelector('#apply-button');
  if (!applyButton) throw new Error('Apply button not found');

  applyButton.click();
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Metrics selected');
}

// Helper: Extract Values
async function extractValues() {
  console.log('Extracting values...');

  const table = document.querySelector('yta-explore-table.data-container');
  if (!table) throw new Error('Table not found');

  const headers = table.querySelectorAll('yta-explore-table-header-cell.metric-column');
  const headerOrder = [];
  headers.forEach(header => {
    const titleEl = header.querySelector('#header-title, .debug-metric-title');
    if (titleEl) {
      headerOrder.push(titleEl.textContent.trim());
    }
  });

  const row = table.querySelector('yta-explore-table-row');
  if (!row) throw new Error('No row found');

  const container = row.querySelector('.layout.horizontal');
  if (!container) throw new Error('Row container not found');

  const metricColumns = Array.from(container.children).filter(child =>
    child.className.includes('metric-column') &&
    child.textContent.trim() !== ''
  );

  const metrics = {
    views: null,
    awt: null,
    consumption: null,
    ctr: null
  };

  metricColumns.forEach((cell, index) => {
    const value = cell.textContent.trim();
    const headerText = headerOrder[index];

    if (!headerText) return;

    const headerLower = headerText.toLowerCase();

    if (headerLower === 'views') {
      metrics.views = value;
    } else if (headerLower.includes('average view duration') || headerLower.includes('average watch time')) {
      metrics.awt = value;
    } else if (headerLower.includes('average percentage')) {
      metrics.consumption = value;
    } else if (headerLower.includes('click-through rate')) {
      metrics.ctr = value;
    }
  });

  console.log('Values extracted');
  return metrics;
}

// Main: Extract PRE/POST Metrics
async function extractPrePostMetrics(preStart, preEnd, postStart, postEnd, statusCallback) {
  try {
    if (statusCallback) statusCallback('🔧 Selecting metrics...');
    await selectMetrics();

    if (statusCallback) statusCallback('📅 Setting PRE period...');
    await setCustomDateRange(preStart, preEnd);

    if (statusCallback) statusCallback('📥 Extracting PRE metrics...');
    const preMetrics = await extractValues();

    if (statusCallback) statusCallback('📅 Setting POST period...');
    await setCustomDateRange(postStart, postEnd);

    if (statusCallback) statusCallback('📥 Extracting POST metrics...');
    const postMetrics = await extractValues();

    if (statusCallback) statusCallback('✅ Extraction complete!');

    return {
      pre: preMetrics,
      post: postMetrics,
      periods: {
        pre: { start: preStart, end: preEnd },
        post: { start: postStart, end: postEnd }
      }
    };

  } catch (error) {
    console.error('Extraction error:', error);
    throw error;
  }
}

// Make panel draggable by header
function makePanelDraggable(panel) {
  const header = panel.querySelector('.helper-header');
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;

  // Add cursor style to indicate draggability
  header.style.cursor = 'move';

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    // Don't drag if clicking on close button or other interactive elements
    if (e.target.classList.contains('helper-close-btn') ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Only drag if clicking on header or drag handle
    if (!header.contains(e.target)) {
      return;
    }

    // Get current position
    const rect = panel.getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;

    isDragging = true;
    header.style.cursor = 'grabbing';
    e.preventDefault(); // Prevent text selection while dragging
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      // Keep panel within viewport
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY));

      panel.style.left = currentX + 'px';
      panel.style.top = currentY + 'px';
      panel.style.right = 'auto';
    }
  }

  function dragEnd() {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'move';

      // Save position to storage
      safeStorage.set({
        panelPosition: {
          left: panel.style.left,
          top: panel.style.top
        }
      });
    }
  }

  // Restore saved position
  safeStorage.get(['panelPosition']).then((result) => {
    if (result.panelPosition) {
      panel.style.left = result.panelPosition.left;
      panel.style.top = result.panelPosition.top;
      panel.style.right = 'auto';
    }
  });
}

// UI: Create floating panel
function createHelperPanel() {
  // Check if panel already exists
  if (document.getElementById('yt-treatment-helper')) {
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'yt-treatment-helper';
  panel.innerHTML = `
    <div class="helper-header">
      <div class="header-content">
        <span class="drag-handle">⋮⋮</span>
        <h3>Treatment Date Comparison</h3>
      </div>
      <button id="helper-close" class="helper-close-btn">×</button>
    </div>
    <div class="helper-body">
      <div class="input-section">
        <label for="treatment-date">Treatment Date:</label>
        <input type="date" id="treatment-date" class="date-input" />
        <button id="calculate-btn" class="action-btn">Calculate Periods</button>
      </div>

      <div id="results-section" class="results-section" style="display: none;">
        <div class="period-info">
          <div class="info-badge">
            <strong>Days Since Treatment:</strong> <span id="days-since">0</span> days
          </div>
        </div>

        <div class="period-block pre-period">
          <h4>PRE Period</h4>
          <div class="date-range">
            <div class="date-item">
              <label>Start:</label>
              <input type="text" id="pre-start" class="date-display" readonly />
              <button class="copy-btn" data-target="pre-start">Copy</button>
            </div>
            <div class="date-item">
              <label>End:</label>
              <input type="text" id="pre-end" class="date-display" readonly />
              <button class="copy-btn" data-target="pre-end">Copy</button>
            </div>
            <div class="period-days">Duration: <span id="pre-days">0</span> days</div>
          </div>
        </div>

        <div class="period-block post-period">
          <h4>POST Period</h4>
          <div class="date-range">
            <div class="date-item">
              <label>Start:</label>
              <input type="text" id="post-start" class="date-display" readonly />
              <button class="copy-btn" data-target="post-start">Copy</button>
            </div>
            <div class="date-item">
              <label>End:</label>
              <input type="text" id="post-end" class="date-display" readonly />
              <button class="copy-btn" data-target="post-end">Copy</button>
            </div>
            <div class="period-days">Duration: <span id="post-days">0</span> days</div>
          </div>
        </div>

        <div class="auto-extract-section">
          <button id="auto-extract-btn" class="action-btn primary-btn">
            🚀 Auto-Extract Metrics
          </button>
          <div id="extraction-status" class="extraction-status" style="display: none;"></div>
        </div>

        <div id="metrics-results" class="metrics-results" style="display: none;">
          <h4>📊 Extracted Metrics</h4>

          <div class="metrics-comparison">
            <div class="metrics-column">
              <h5>PRE Period</h5>
              <div class="metric-item">
                <span class="metric-label">Views:</span>
                <span id="pre-views" class="metric-value">—</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">CTR:</span>
                <span id="pre-ctr" class="metric-value">—</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">AWT:</span>
                <span id="pre-awt" class="metric-value">—</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Consumption:</span>
                <span id="pre-consumption" class="metric-value">—</span>
              </div>
            </div>

            <div class="metrics-column">
              <h5>POST Period</h5>
              <div class="metric-item">
                <span class="metric-label">Views:</span>
                <span id="post-views" class="metric-value">—</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">CTR:</span>
                <span id="post-ctr" class="metric-value">—</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">AWT:</span>
                <span id="post-awt" class="metric-value">—</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Consumption:</span>
                <span id="post-consumption" class="metric-value">—</span>
              </div>
            </div>
          </div>

          <button id="copy-metrics-btn" class="action-btn">Copy All Metrics</button>
        </div>

        <div class="instructions">
          <p><strong>Manual Option:</strong></p>
          <ol>
            <li>Copy the PRE period dates using the buttons above</li>
            <li>Apply them to YouTube Studio date filter</li>
            <li>Note down the metrics you want to compare</li>
            <li>Copy the POST period dates and repeat</li>
            <li>Compare the results manually</li>
          </ol>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Make panel draggable
  makePanelDraggable(panel);

  // Event Listeners
  document.getElementById('helper-close').addEventListener('click', () => {
    panel.style.display = 'none';
  });

  document.getElementById('calculate-btn').addEventListener('click', () => {
    const treatmentDate = document.getElementById('treatment-date').value;

    if (!treatmentDate) {
      alert('Please select a treatment date');
      return;
    }

    const ranges = calculateDateRanges(treatmentDate);

    // Display results
    document.getElementById('days-since').textContent = ranges.daysSince;

    document.getElementById('pre-start').value = ranges.pre.start;
    document.getElementById('pre-end').value = ranges.pre.end;
    document.getElementById('pre-days').textContent = ranges.pre.days;

    document.getElementById('post-start').value = ranges.post.start;
    document.getElementById('post-end').value = ranges.post.end;
    document.getElementById('post-days').textContent = ranges.post.days;

    document.getElementById('results-section').style.display = 'block';

    // Save to storage for future use
    safeStorage.set({
      lastTreatmentDate: treatmentDate,
      lastCalculatedRanges: ranges
    });
  });

  // Copy button functionality
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = e.target.getAttribute('data-target');
      const input = document.getElementById(targetId);

      // Copy to clipboard
      navigator.clipboard.writeText(input.value).then(() => {
        const originalText = e.target.textContent;
        e.target.textContent = 'Copied!';
        e.target.classList.add('copied');

        setTimeout(() => {
          e.target.textContent = originalText;
          e.target.classList.remove('copied');
        }, 1500);
      });
    });
  });

  // Auto-Extract button functionality
  document.getElementById('auto-extract-btn').addEventListener('click', async () => {
    // Check if on Advanced Mode page
    if (!window.location.href.includes('/explore?')) {
      alert('Please navigate to Advanced Mode first.\n\nSteps:\n1. Go to any video\'s Analytics\n2. Click "See more" or "Advanced mode"\n3. Then click "Auto-Extract Metrics"');
      return;
    }

    // Get the calculated date ranges
    const preStart = document.getElementById('pre-start').value;
    const preEnd = document.getElementById('pre-end').value;
    const postStart = document.getElementById('post-start').value;
    const postEnd = document.getElementById('post-end').value;

    if (!preStart || !postStart) {
      alert('Please calculate date ranges first by clicking "Calculate Periods"');
      return;
    }

    const statusEl = document.getElementById('extraction-status');
    const autoExtractBtn = document.getElementById('auto-extract-btn');

    try {
      // Show status, disable button
      statusEl.style.display = 'block';
      statusEl.className = 'extraction-status';
      autoExtractBtn.disabled = true;

      const updateStatus = (message) => {
        statusEl.textContent = message;
      };

      // Run extraction
      const result = await extractPrePostMetrics(
        preStart, preEnd,
        postStart, postEnd,
        updateStatus
      );

      // Display results
      document.getElementById('pre-views').textContent = result.pre.views || '—';
      document.getElementById('pre-ctr').textContent = result.pre.ctr || '—';
      document.getElementById('pre-awt').textContent = result.pre.awt || '—';
      document.getElementById('pre-consumption').textContent = result.pre.consumption || '—';

      document.getElementById('post-views').textContent = result.post.views || '—';
      document.getElementById('post-ctr').textContent = result.post.ctr || '—';
      document.getElementById('post-awt').textContent = result.post.awt || '—';
      document.getElementById('post-consumption').textContent = result.post.consumption || '—';

      document.getElementById('metrics-results').style.display = 'block';

      statusEl.textContent = '✅ Metrics extracted successfully!';
      statusEl.className = 'extraction-status success';

      // Save to storage
      safeStorage.set({
        lastExtractedMetrics: result
      });

    } catch (error) {
      console.error('Extraction failed:', error);

      // Check if it's an extension context error
      if (!isExtensionContextValid()) {
        statusEl.innerHTML = `❌ Extension reloaded. Please <strong>refresh this page</strong> (F5) to continue.`;
        statusEl.className = 'extraction-status error';
        alert('The extension was reloaded.\n\nPlease refresh this page (press F5) and try again.');
      } else {
        statusEl.textContent = `❌ Error: ${error.message}`;
        statusEl.className = 'extraction-status error';
      }
    } finally {
      autoExtractBtn.disabled = false;
    }
  });

  // Copy All Metrics button functionality
  document.getElementById('copy-metrics-btn').addEventListener('click', () => {
    const preViews = document.getElementById('pre-views').textContent;
    const preCtr = document.getElementById('pre-ctr').textContent;
    const preAwt = document.getElementById('pre-awt').textContent;
    const preConsumption = document.getElementById('pre-consumption').textContent;

    const postViews = document.getElementById('post-views').textContent;
    const postCtr = document.getElementById('post-ctr').textContent;
    const postAwt = document.getElementById('post-awt').textContent;
    const postConsumption = document.getElementById('post-consumption').textContent;

    const text = `PRE Period Metrics:
Views: ${preViews}
CTR: ${preCtr}
AWT: ${preAwt}
Consumption: ${preConsumption}

POST Period Metrics:
Views: ${postViews}
CTR: ${postCtr}
AWT: ${postAwt}
Consumption: ${postConsumption}`;

    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('copy-metrics-btn');
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('copied');

      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('copied');
      }, 1500);
    });
  });

  // Load last used treatment date if available
  safeStorage.get(['lastTreatmentDate']).then((result) => {
    if (result.lastTreatmentDate) {
      document.getElementById('treatment-date').value = result.lastTreatmentDate;
    }
  });
}

// Add toggle button to YouTube Studio header
function addToggleButton() {
  // Wait for YouTube Studio header to load
  const checkHeader = setInterval(() => {
    const header = document.querySelector('ytcp-app-header') ||
                   document.querySelector('.ytcp-header') ||
                   document.querySelector('#header');

    if (header && !document.getElementById('treatment-helper-toggle')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'treatment-helper-toggle';
      toggleBtn.className = 'treatment-helper-toggle';
      toggleBtn.textContent = 'Treatment Comparison';
      toggleBtn.title = 'Open Treatment Date Comparison Helper';

      toggleBtn.addEventListener('click', () => {
        const panel = document.getElementById('yt-treatment-helper');
        if (panel) {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        } else {
          createHelperPanel();
        }
      });

      header.appendChild(toggleBtn);
      clearInterval(checkHeader);
    }
  }, 1000);

  // Stop checking after 10 seconds
  setTimeout(() => clearInterval(checkHeader), 10000);
}

// Initialize when page loads
function init() {
  console.log('YouTube Treatment Comparison Helper loaded');

  // Only run on YouTube Studio Analytics pages
  if (window.location.hostname === 'studio.youtube.com') {
    addToggleButton();
    createHelperPanel();
  }
}

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
