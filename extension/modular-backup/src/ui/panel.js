/**
 * UI Panel creation and initialization
 */

import { YOUTUBE_DATA_DELAY_DAYS, SELECTORS } from '../config/constants.js';
import { makePanelDraggable } from '../utils/domHelpers.js';
import { safeStorage } from '../utils/storageHelpers.js';
import { setupEventHandlers } from './eventHandlers.js';

/**
 * Get panel HTML template
 */
function getPanelHTML() {
  return `
    <div class="helper-header">
      <span class="helper-title">Treatment Comparison</span>
      <button id="helper-close" class="close-btn">×</button>
    </div>

    <div class="helper-body">
      <!-- Step 1: Input -->
      <div class="input-section">
        <label class="input-label">SELECT TREATMENT DATE</label>
        <div class="date-input-row">
          <input type="date" id="treatment-date" class="date-input" />
          <button id="calculate-btn" class="action-btn primary-btn">Calculate</button>
        </div>
      </div>

      <!-- Step 2: Results -->
      <div id="results-section" class="results-section" style="display: none;">
        <div class="section-header">
          <span class="section-title">CALCULATED PERIODS</span>
          <button id="edit-dates-btn" class="edit-btn">Edit</button>
        </div>

        <div class="periods-container">
          <div class="period-block pre-period">
            <div class="period-header">
              <span class="period-label">PRE</span>
              <span class="period-duration"><span id="pre-days">0</span>d</span>
            </div>
            <div class="period-dates-vertical">
              <div class="date-row">
                <label class="date-label">Start</label>
                <input type="date" id="pre-start" class="date-edit" disabled />
              </div>
              <div class="date-row">
                <label class="date-label">End</label>
                <input type="date" id="pre-end" class="date-edit" disabled />
              </div>
            </div>
          </div>

          <div class="period-block post-period">
            <div class="period-header">
              <span class="period-label">POST</span>
              <span class="period-duration"><span id="post-days">0</span>d</span>
            </div>
            <div class="period-dates-vertical">
              <div class="date-row">
                <label class="date-label">Start</label>
                <input type="date" id="post-start" class="date-edit" disabled />
              </div>
              <div class="date-row">
                <label class="date-label">End</label>
                <input type="date" id="post-end" class="date-edit" disabled />
              </div>
            </div>
          </div>
        </div>

        <!-- Warning for unequal periods -->
        <div id="period-warning" class="period-warning" style="display: none;">
          ⚠️ PRE period is shorter than POST because the video publish date was reached.
        </div>

        <!-- Error for invalid treatment date -->
        <div id="treatment-error" class="treatment-error" style="display: none;">
          ❌ Treatment date cannot be before the video was published!
        </div>

        <!-- Step 3: Extract -->
        <div class="extract-controls">
          <button id="auto-extract-btn" class="action-btn extract-btn">
            <span class="btn-icon">📊</span> Extract Metrics
          </button>
          <button id="cancel-extract-btn" class="cancel-btn" style="display: none;">Cancel</button>
        </div>

        <!-- Progress Bar -->
        <div id="progress-container" class="progress-container" style="display: none;">
          <div class="progress-wrapper">
            <div class="progress-bar">
              <div id="progress-fill" class="progress-fill"></div>
            </div>
            <span id="progress-percent" class="progress-percent">0%</span>
          </div>
          <div id="progress-message" class="progress-message"></div>
        </div>

        <!-- Metrics Results -->
        <div id="metrics-results" class="metrics-results" style="display: none;">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-header">
                <span class="metric-name">Views</span>
                <button class="copy-btn" data-metric="views">Copy</button>
              </div>
              <div class="metric-values">
                <div class="metric-value">
                  <span class="value-label">PRE</span>
                  <span class="value-text" id="pre-views">—</span>
                </div>
                <div class="metric-value">
                  <span class="value-label">POST</span>
                  <span class="value-text" id="post-views">—</span>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-header">
                <span class="metric-name">AWT</span>
                <button class="copy-btn" data-metric="awt">Copy</button>
              </div>
              <div class="metric-values">
                <div class="metric-value">
                  <span class="value-label">PRE</span>
                  <span class="value-text" id="pre-awt">—</span>
                </div>
                <div class="metric-value">
                  <span class="value-label">POST</span>
                  <span class="value-text" id="post-awt">—</span>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-header">
                <span class="metric-name">CTR</span>
                <button class="copy-btn" data-metric="ctr">Copy</button>
              </div>
              <div class="metric-values">
                <div class="metric-value">
                  <span class="value-label">PRE</span>
                  <span class="value-text" id="pre-ctr">—</span>
                </div>
                <div class="metric-value">
                  <span class="value-label">POST</span>
                  <span class="value-text" id="post-ctr">—</span>
                </div>
              </div>
            </div>
          </div>

          <button id="copy-all-btn" class="action-btn copy-all-btn">Copy All</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create and inject the panel
 */
export function createPanel() {
  const panel = document.createElement('div');
  panel.id = SELECTORS.PANEL;
  panel.innerHTML = getPanelHTML();

  document.body.appendChild(panel);

  // Set max date to 2 days ago
  const today = new Date();
  const maxYouTubeDate = new Date(today);
  maxYouTubeDate.setDate(maxYouTubeDate.getDate() - YOUTUBE_DATA_DELAY_DAYS);
  const maxDate = maxYouTubeDate.toISOString().split('T')[0];
  document.getElementById('treatment-date').setAttribute('max', maxDate);

  // Make panel draggable
  makePanelDraggable(panel);

  // Check saved visibility state
  safeStorage.get(['panelVisible']).then((result) => {
    if (result.panelVisible === false) {
      panel.style.display = 'none';
    }
  });

  // Restore saved position
  safeStorage.get(['panelPosition']).then((result) => {
    if (result.panelPosition) {
      panel.style.left = result.panelPosition.left;
      panel.style.top = result.panelPosition.top;
      panel.style.right = 'auto';
    }
  });

  // Setup all event handlers
  setupEventHandlers();

  // Restore last calculated ranges if any
  safeStorage.get(['lastCalculatedRanges', 'lastTreatmentDate']).then((result) => {
    if (result.lastTreatmentDate) {
      document.getElementById('treatment-date').value = result.lastTreatmentDate;
    }
    if (result.lastCalculatedRanges) {
      const ranges = result.lastCalculatedRanges;
      document.getElementById('pre-start').value = ranges.pre.start;
      document.getElementById('pre-end').value = ranges.pre.end;
      document.getElementById('pre-days').textContent = ranges.pre.days;
      document.getElementById('post-start').value = ranges.post.start;
      document.getElementById('post-end').value = ranges.post.end;
      document.getElementById('post-days').textContent = ranges.post.days;
      document.getElementById('results-section').style.display = 'block';
    }
  });
}

/**
 * Create toggle button
 */
export function createToggleButton() {
  const toggle = document.createElement('button');
  toggle.className = SELECTORS.TOGGLE_BUTTON;
  toggle.textContent = 'Treatment Helper';
  toggle.style.cssText = 'position:fixed;top:10px;right:20px;z-index:10001;';

  toggle.addEventListener('click', async () => {
    const panel = document.getElementById(SELECTORS.PANEL);
    if (panel) {
      const isVisible = panel.style.display !== 'none';
      panel.style.display = isVisible ? 'none' : 'block';
      await safeStorage.set({ panelVisible: !isVisible });
    }
  });

  document.body.appendChild(toggle);
}
