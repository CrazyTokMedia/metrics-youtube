# Home Page vs Advanced Mode Extraction Analysis

## Purpose

Need to support extracting metrics from **both** Analytics Home page and Advanced Mode to compare data sources and validate accuracy.

---

## Current State: Advanced Mode Extraction (Implemented)

### Location
`extension/content.js` - Functions: `selectMetrics()`, `extractValues()`, `extractRetentionMetric()`

### How it works
1. Navigate to Advanced Mode (explore page)
2. Opens metric picker dialog
3. Selects specific metrics via checkboxes
4. Reads from `yta-explore-table` table rows
5. Extracts retention from SVG chart on separate page

### Metrics Available in Advanced Mode
✅ **VIDEO_THUMBNAIL_IMPRESSIONS** - Impressions count
✅ **EXTERNAL_VIEWS** - Views from outside YouTube
✅ **AVERAGE_WATCH_TIME** - Average watch time
✅ **AVERAGE_WATCH_PERCENTAGE** - Average view duration %
✅ **VIDEO_THUMBNAIL_IMPRESSIONS_VTR** - Click-through rate
✅ **Retention** - 30s/3s retention from chart (separate page)

### DOM Structure (Advanced Mode)
```html
<yta-explore-table class="data-container">
  <yta-explore-table-row>
    <div class="layout horizontal">
      <div class="metric-column">VALUE1</div>
      <div class="metric-column">VALUE2</div>
      ...
    </div>
  </yta-explore-table-row>
</yta-explore-table>
```

---

## New Requirement: Home Page Extraction

### Location
Analytics Home: `https://studio.youtube.com/channel/{CHANNEL_ID}/analytics`

### DOM Structure (Home Page)
```html
<yta-key-metric-card>
  <tp-yt-paper-listbox id="key-metric-blocks">
    <tp-yt-paper-item id="EXTERNAL_VIEWS-tab">
      <yta-key-metric-block>
        <div id="metric-label">Views</div>
        <div id="metric-total">71</div>
        <div id="performance-label">79 less than usual</div>
      </yta-key-metric-block>
    </tp-yt-paper-item>
    <tp-yt-paper-item id="EXTERNAL_WATCH_TIME-tab">
      <yta-key-metric-block>
        <div id="metric-label">Watch time (hours)</div>
        <div id="metric-total">...</div>
      </yta-key-metric-block>
    </tp-yt-paper-item>
    <!-- More metrics... -->
  </tp-yt-paper-listbox>
</yta-key-metric-card>
```

### Metrics Available on Home Page

Based on the HTML analysis:

✅ **Views** (`EXTERNAL_VIEWS`) - Total views since published
✅ **Watch time (hours)** (`EXTERNAL_WATCH_TIME`) - Total watch time
❓ **Impressions** - Need to verify if available
❓ **CTR** - Need to verify if available
❓ **Average view duration** - Need to verify if available
❓ **Retention** - Unlikely on home page, probably chart-only

### Key Differences Noted

| Aspect | Home Page | Advanced Mode |
|--------|-----------|---------------|
| **Location** | Analytics home | Per-video Advanced Mode |
| **Date filtering** | Available via date picker | Available via custom date range |
| **Metric selection** | Fixed tabs/cards | Custom via metric picker |
| **Data granularity** | Summary cards | Detailed table |
| **Retention data** | Likely no chart | Separate retention page with chart |
| **Data freshness** | ? | ? |

---

## Questions to Answer

### 1. Metric Availability
- [ ] Which exact metrics are available on Home page?
- [ ] Can we get Impressions on Home page?
- [ ] Can we get CTR on Home page?
- [ ] Can we get Average watch time (not total) on Home page?
- [ ] Is Retention available anywhere on Home page?

### 2. Date Range Support
- [ ] Does Home page support custom date ranges?
- [ ] Is the date picker the same as Advanced Mode?
- [ ] Can we set PRE/POST periods on Home page?

### 3. Data Accuracy
- [ ] Do metrics match between Home and Advanced?
- [ ] If they differ, which is more accurate?
- [ ] Are calculations different (e.g., total vs average)?

### 4. Navigation
- [ ] Are we on Home page by default when opening Analytics?
- [ ] How to navigate from per-video page to Home?
- [ ] Do we need to change channels/scopes?

---

## Proposed Investigation Steps

### Step 1: Manual Testing (User to do)
1. Open YouTube Studio Analytics Home
2. Note which metrics are shown in the key metric cards
3. Set a custom date range
4. Screenshot or copy the metric values
5. Navigate to Advanced Mode for same video
6. Set the same date range
7. Compare values - do they match?

### Step 2: DOM Exploration (Claude to do)
1. Parse the `entire-home-page-analytics-tab.html` file thoroughly
2. Identify all `yta-key-metric-block` elements
3. Map metric IDs to metric labels
4. Find date picker DOM structure
5. Document selectors needed for extraction

### Step 3: Implementation Design
Based on findings, design:
- `extractFromHomePage()` function
- How to select/navigate to correct metrics
- How to set date ranges
- How to read metric values

---

## Current Architecture Impact

### Where this fits in the refactoring:

```
YTTreatmentHelper.API = {
  // Existing (Advanced Mode)
  selectMetrics()
  extractValues()
  extractRetentionMetric()

  // NEW (Home Page)
  extractFromHomePage()  // ← New function

  // Orchestration
  extractPrePostMetrics()  // ← Needs update to support both sources
}
```

### UI Changes Needed

Add a selector in the extension panel:
```
Data Source:
○ Advanced Mode (detailed metrics)
○ Home Page (summary metrics)
○ Both (compare sources)
```

---

## Development Path Forward

### Option A: Investigate First (Recommended)
1. **Stop refactoring at Phase 3 completion**
2. Manually test Home vs Advanced metrics
3. Document differences in detail
4. Design Home page extraction
5. Resume refactoring with Home page support included

### Option B: Implement Home After Refactoring
1. Complete Phases 3-5 (modular architecture)
2. Then add Home page extraction as a new feature
3. Risk: Architecture might not fit well

### Option C: Implement in Parallel
1. Let agent finish Phase 3-4
2. I build Home page extraction prototype in parallel
3. Merge both when ready

---

## Next Actions

**Immediate**:
1. User tests Home page manually
2. User documents which metrics are available
3. User compares values with Advanced Mode

**Then**:
1. Claude analyzes Home page DOM structure
2. Claude designs extraction function
3. Decide whether to integrate into current refactoring or add later

---

**Created**: 2025-11-06
**Status**: Investigation needed - awaiting user testing
**Dependencies**: Phase 3 refactoring in progress (agent working)
