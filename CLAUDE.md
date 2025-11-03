# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**YouTube Treatment Comparison Helper** is a Chrome extension (Manifest V3) that automates PRE vs POST treatment period comparison in YouTube Studio Analytics. It extracts metrics before and after a treatment (thumbnail change, title change, etc.) for analysis.

**Repository**: CrazyTokMedia/metrics-youtube
**Internal tool**: For CrazyTok Media use

## Development Commands

### Creating a Release

```bash
# Auto-detect version from manifest.json and create GitHub release
python -X utf8 create_release.py --auto --update-readme --template default

# Create draft release (for review)
python -X utf8 create_release.py --auto --draft

# Only create ZIP without GitHub release
python -X utf8 create_release.py --zip-only --auto
```

**Requirements**:
- Python 3.x with `requests` library
- GitHub personal access token in `.env` file: `GITHUB_TOKEN=ghp_xxx`
- Must use `python -X utf8` on Windows for Unicode handling

### Version Management

1. **Bump version** in `extension/manifest.json`
2. **Update CHANGELOG.md** with new entry
3. **Commit changes**: `git add extension/manifest.json CHANGELOG.md && git commit && git push`
4. **Create release**: Run `create_release.py --auto --update-readme`

The script will:
- Auto-detect version from `manifest.json`
- Create ZIP of extension files
- Create GitHub release with formatted description
- Upload ZIP as release asset
- Update README.md download link
- Clean up local ZIP file after upload

## Architecture & Code Organization

### Extension Structure

```
extension/
├── manifest.json      # Extension manifest (Manifest V3)
├── content.js         # Main content script (~3200 lines)
├── logger.js          # Centralized logging system
├── popup.html/js      # Extension popup UI
├── styles.css         # UI styles (modern minimal design)
└── icons/            # Extension icons
```

### Key Technical Concepts

#### 1. Date Format Handling

**Critical**: The extension uses a dual-format strategy:
- **UI Display**: DD/MM/YYYY (user-friendly, international standard)
- **Internal Calculations**: YYYY-MM-DD (for Date object compatibility)

```javascript
// Helper functions for conversion
formatDateToDDMMYYYY(dateStr)  // YYYY-MM-DD → DD/MM/YYYY
formatDateToYYYYMMDD(dateStr)  // DD/MM/YYYY → YYYY-MM-DD
```

**Storage pattern**:
- Display dates in DD/MM/YYYY in `input.value`
- Store YYYY-MM-DD in `input.dataset.original` for calculations
- All internal date math uses `dataset.original`

#### 2. Smart Date Ordering Logic

To prevent YouTube validation errors ("start date after end date"):
- Compares **full timestamps**, not just day numbers
- Determines whether to set start or end date first
- Sets dates in order that **expands** the range (not contracts)

**Critical function**: `setCustomDateRange()` at line 516

#### 3. YouTube Studio DOM Interaction

The extension interacts with YouTube Studio's internal DOM structure:

**Date Picker Navigation**:
- Detects format from cached values in YouTube's UI
- Uses `ytcp-date-period-picker` for custom date ranges
- Handles both regular Content tab and Audience Retention tab
- Implements smart retry with alternate format on validation failure

**Metrics Extraction**:
- Finds `yta-explore-table.data-container` for metrics table
- Reads headers to map column order
- Extracts values by matching header text (case-insensitive)

**Navigation**:
- `navigateToAnalyticsTab()`: Switch to Analytics tab
- `navigateToAdvancedMode()`: Enter Advanced Mode for date control
- `navigateToAudienceRetention()`: Switch to retention chart
- `navigateBackToMetrics()`: Return to Top content metrics

#### 4. Metric Selection & Extraction

**Metrics selected** (in order):
1. `VIDEO_THUMBNAIL_IMPRESSIONS` - Impressions count
2. `EXTERNAL_VIEWS` - Views from outside YouTube
3. `AVERAGE_WATCH_TIME` - Average watch time
4. `AVERAGE_WATCH_PERCENTAGE` - Average view duration %
5. `VIDEO_THUMBNAIL_IMPRESSIONS_VTR` - Click-through rate

**Extraction flow**:
1. `selectMetrics()`: Configure which metrics to display
2. `setCustomDateRangeWithRetry()`: Set date range (with retry)
3. `extractValues()`: Read from metrics table
4. `extractRetentionMetric()`: Optionally get retention (separate chart)

#### 5. Spreadsheet Export Format

**Export format** (tab-separated):
```
Treatment Date | Pre Impressions | Post Impressions | [empty] | Pre CTR | Post CTR | [empty] | Pre AWT | Post AWT | Pre Retention | Post Retention
```

- Treatment date formatted as: `Pre - DD.MM.YYYY-DD.MM.YYYY Post- DD.MM.YYYY-DD.MM.YYYY`
- No leading empty cell (allows paste next to existing video titles)
- Empty cells for "Change" columns (calculated in spreadsheet)

#### 6. Logger System

Centralized logging with:
- Multiple log levels (ERROR, WARN, INFO, DEBUG, USER_ACTION)
- Session tracking
- Chrome storage persistence (max 500 entries, 2MB limit)
- Export to JSON file
- Context validity checking (prevents error loops on extension reload)

**Critical**: Logger checks `chrome.runtime.id` before saving to prevent infinite error loops when extension context is invalidated.

### Main Content Script Flow

1. **Initialization** (`init()`):
   - Waits for page load
   - Creates toggle button
   - Watches for video changes
   - Registers cleanup handlers

2. **Panel Creation** (`createHelperPanel()`):
   - Injects floating UI panel
   - Sets up event listeners
   - Loads last treatment date from storage
   - Makes panel draggable

3. **Date Calculation**:
   - User enters treatment date (DD/MM/YYYY)
   - Convert to YYYY-MM-DD for calculations
   - `calculateDateRanges()`: Compute equal-length PRE/POST periods
   - Account for video publish date and YouTube data availability
   - Display results in DD/MM/YYYY format

4. **Metric Extraction** (`extractPrePostMetrics()`):
   - Navigate to Advanced Mode
   - Select required metrics
   - Set PRE date range → extract values
   - Set POST date range → extract values
   - Optionally extract retention (requires tab switch)
   - Display results in UI

5. **Export**:
   - "Copy Pre/Post" buttons: Individual period data
   - "Copy for Spreadsheet" button: All metrics in tab-separated format

### UI Design System

**Design principles**: Modern, minimal, spacious

**Color scheme**:
- Primary gradient: `#667eea` → `#764ba2` (purple)
- Success: `#10b981` (green)
- Error: `#ef4444` (red)
- Info: `#0ea5e9` (blue)

**Component patterns**:
- `.action-btn`: Standard buttons with gradient backgrounds
- `.copy-btn`: Copy buttons with green gradient
- `.period-block`: PRE/POST date range cards
- `.metrics-column`: PRE/POST metrics display
- `.export-section`: Spreadsheet export container

### Critical Gotchas

1. **Always use `python -X utf8`** on Windows to prevent Unicode errors
2. **Never commit** `.env` file (contains GitHub token)
3. **Date conversions**: Always convert DD/MM/YYYY to YYYY-MM-DD before calculations
4. **YouTube DOM**: Structure can change; use flexible selectors and retries
5. **Extension context**: Check validity before chrome.storage operations
6. **Date ordering**: Must set dates in correct order to avoid YouTube validation errors

## Date Format Implementation Details

When changing date-related code:

1. **User inputs** are DD/MM/YYYY text fields with auto-formatting
2. **Calculate button** converts DD/MM/YYYY → YYYY-MM-DD immediately
3. **All calculations** use YYYY-MM-DD stored in `dataset.original`
4. **Display updates** show DD/MM/YYYY in `input.value`
5. **Extraction** reads from `dataset.original` (YYYY-MM-DD)
6. **Storage** saves DD/MM/YYYY with backward compatibility for old format

## Testing Workflow

**Manual testing checklist**:
1. Load extension in Chrome (`chrome://extensions/` → Developer mode → Load unpacked)
2. Navigate to YouTube Studio video analytics
3. Click extension icon → Enter treatment date
4. Verify date calculations (equal PRE/POST periods)
5. Click "Extract Metrics" → Verify all metrics extracted
6. Test spreadsheet export → Paste in Google Sheets
7. Test with different videos (short/long, different publish dates)
8. Check browser console for errors
9. Export logs from popup for debugging

## Git Workflow

**Commit format** (auto-generated by Claude Code):
```
<concise title>

<detailed description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Never archive files by deletion** - always move to `archive/` directory.

## Common Development Patterns

### Adding a New Metric

1. Add metric ID to `metricsToSelect` array in `selectMetrics()`
2. Add extraction logic in `extractValues()` (match header text)
3. Add display field in HTML (`createHelperPanel()`)
4. Update result display in `extractPrePostMetrics()`
5. Update spreadsheet export format if needed

### Modifying Date Logic

1. **Never** change internal YYYY-MM-DD format
2. Only change display conversion functions
3. Always update both `formatDateToDDMMYYYY()` and `formatDateToYYYYMMDD()`
4. Test backward compatibility with old stored dates

### Updating UI Styles

1. Modify `styles.css` (never use inline styles)
2. Follow existing design system patterns
3. Test responsive behavior (max-width: 480px)
4. Ensure consistent spacing and border radius

## Important Files

- **`extension/manifest.json`**: Version number (bump for releases)
- **`CHANGELOG.md`**: Version history (update for each release)
- **`README.md`**: User documentation (auto-updated by release script)
- **`.env`**: Contains `GITHUB_TOKEN` (never commit)
- **`extension/content.js`**: Main logic (~3200 lines, well-commented)
- **`extension/logger.js`**: Logging system (handles context invalidation)
- **`extension/styles.css`**: Complete UI design system
