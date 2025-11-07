# Changelog

All notable changes to the YouTube Treatment Comparison Helper will be documented here.

## [2.0.0] - 2025-11-08

### 🎉 Major Release - Modular Architecture & Batch Processing

This release represents a complete architectural overhaul with significant new features and improvements.

### Added
- **Batch Mode**: Process multiple videos in sequence
  - Extract metrics from multiple videos automatically by pasting YouTube Studio URLs
  - Support for multiple URL formats (studio URLs, watch URLs, Shorts URLs)
  - Progress tracking with step-by-step status updates
  - Cancel functionality to stop batch processing mid-operation
  - Three export modes: Complete Analysis, Equal Periods, and Lifetime
- **Batch Extraction History**: Track and review past batch extractions
  - History viewer in extension popup with dropdown interface
  - Export historical batch data
  - Persistent storage of batch results
- **Granular Progress Tracking**: Step-level and sub-step progress indicators
  - Real-time status updates during extraction
  - Visual progress bar for batch operations
  - Auto-scroll to results when extraction completes
- **YouTube Shorts Support**: Full compatibility with Shorts videos in batch mode
  - Automatic Shorts detection and handling
  - Proper navigation to Advanced Mode for Shorts
- **Documentation**: Added comprehensive date handling audit and export format documentation
  - DATE_HANDLING_AUDIT.md: Documents date format consistency improvements
  - PROPOSED_EXPORT_FORMAT.md: Simplified batch export format design

### Changed
- **Modular Architecture**: Complete code reorganization for maintainability
  - `content-utils.js`: Utility functions and date formatting
  - `content-youtube-api.js`: YouTube Studio DOM interaction and API logic
  - `content-single-video.js`: Single-video UI and extraction flow
  - `content-batch.js`: Batch processing logic and UI
  - `content.js`: Main orchestration and initialization
- **Batch Export Quality**: Improved title extraction and publish date handling
- **UI Improvements**: Better spacing, padding, and container structure in batch mode
- **Drag Behavior**: Remove document-level drag listeners when not actively dragging

### Fixed
- **Critical Syntax Error**: Fixed error that was preventing extension panel from showing
- **Progress Bar**: Fixed skipping steps in complete mode
- **Batch UI Persistence**: Fixed batch mode UI not persisting properly on analytics page
- **Input Clickability**: Fixed inputs not being clickable due to pointer-events CSS
- **Scroll Accessibility**: Ensured export buttons are always reachable by scrolling
- **Zoom Compatibility**: Use flexbox instead of fixed height calculations for better zoom support
- **Duplicate Padding**: Removed duplicate padding in batch mode interface
- **Container Display State**: Set explicit display state for single-video-container
- **Advanced Mode Navigation**: Properly navigate to Advanced Mode before extraction in batch mode
- **Stayed to Watch Metric**: Properly extract metric from YouTube Analytics in batch mode

### Performance
- **Drastically Reduced Wait Times**: Batch navigation now 3-5x faster
  - Reduced Advanced Mode navigation waits
  - Removed unnecessary waits in batch extraction flow
  - Optimized retry mechanisms

### Technical Details
- 47 commits with systematic refactoring across 6 phases
- Backward compatible with existing single-video extraction workflow
- Enhanced error handling and logging throughout
- Improved code organization following separation of concerns principles

### Migration Notes
- Existing users will see new "Batch Mode" toggle in the extension panel
- Single-video extraction workflow remains unchanged
- All existing features continue to work as before

## [1.2.2] - 2025-11-07

### Fixed
- **Duration Format for Google Sheets**: Average Watch Time now exports in proper HH:MM:SS duration format
  - Converts YouTube's "1:23" format to "00:01:23" for all copy buttons
  - Ensures Google Sheets interprets values as durations rather than time-of-day
  - Applied to: Copy Pre/Post buttons, Copy for Spreadsheet, Copy Complete Analysis
  - Prevents formatting issues when pasting metrics into spreadsheets

## [1.2.1] - 2025-11-06

### Added
- **"Stayed to watch" metric for YouTube Shorts**: New metric extraction specifically for Shorts videos
  - Extracts SHORTS_FEED_IMPRESSIONS_VTR from YouTube Analytics
  - Displays in all extraction modes (Equal Periods, Lifetime, Complete Analysis)
  - Included in both spreadsheet export and complete analysis export
  - Shows percentage of viewers who stayed to watch the Short
  - Column headers updated in complete_analysis_headers.txt

### Note
- "Stayed to watch" metric will only display values for Shorts videos; regular videos show "—" or "N/A"

## [1.2.0] - 2025-11-04

### Added
- **Complete Analysis Mode**: New extraction mode that combines both Equal Periods and Lifetime data in one operation
  - Extracts equal periods comparison data (balanced PRE/POST)
  - Extracts lifetime performance data (publish→treatment, publish→today)
  - Displays results in two organized sections
  - Single "Copy Complete Data" button exports all metrics at once
  - Now set as default extraction mode
- **Enhanced Export Format**: 35-column tab-separated output with Change columns
  - Publish Date, Treatment Date, Extraction Date (DD.MM.YYYY format)
  - Equal Periods: 5 metrics × (PRE, POST, Change) = 15 columns
  - 2 separator columns
  - Lifetime: 5 metrics × (PRE, POST, Change) = 15 columns
  - Ready for Google Sheets with formula columns
  - Includes complete_analysis_headers.txt for easy spreadsheet setup

### Fixed
- **Advanced Mode Navigation**: Complete Analysis now properly navigates to Advanced Mode before extraction
  - Matches behavior of Equal Periods and Lifetime modes
  - Ensures consistent extraction flow

### Changed
- Complete Analysis is now the default and top option in extraction mode selection
- Reordered radio buttons: Complete Analysis, Equal Periods, Lifetime

## [1.1.0] - 2025-11-03

### Added
- **Extraction Mode Selection**: Choose between two extraction modes before extracting metrics
  - **Equal Periods**: For treatment comparison with balanced PRE/POST periods (spreadsheet export)
  - **Lifetime**: For Airtable with full video performance (publish→treatment, publish→today)
  - Radio button interface appears after calculating date ranges
  - Copy buttons adapt based on selected mode

### Fixed
- **Report Menu Navigation**: Fixed issue where extension couldn't find "Top content" option after lifetime extraction
  - Improved menu detection with multiple fallback strategies
  - Properly closes leftover dialogs from previous operations
  - More reliable navigation between Audience Retention and Top Content tabs
- **Copy for Spreadsheet Error**: Fixed "Cannot read properties of null" error when clicking copy button
  - Event handler now correctly excludes spreadsheet button from period-based copy logic

### Changed
- Date ranges update in UI after extraction to reflect actual periods used in lifetime mode
- Copy Pre/Post buttons only visible in Lifetime mode
- Copy for Spreadsheet button only visible in Equal Periods mode

## [1.0.5] - 2025-11-03

### Added
- **Views in Spreadsheet Export**: Pre-views and post-views now included in spreadsheet export
  - Adds views data at the end of tab-separated format
  - Provides complete metrics for analysis
- **CLAUDE.md Documentation**: Comprehensive development guide for future Claude Code instances
  - Architecture and code organization patterns
  - Date format dual-strategy explanation
  - Common development patterns and gotchas

### Changed
- Spreadsheet export format now includes views as final columns

## [1.0.4] - 2025-11-03

### Added
- **Impressions Extraction**: Now captures video thumbnail impressions metric
- **Spreadsheet Export**: One-click copy button to export all metrics in spreadsheet-ready format
  - Formats dates as "Pre - DD.MM.YYYY-DD.MM.YYYY Post- DD.MM.YYYY-DD.MM.YYYY"
  - Tab-separated format for easy paste into Google Sheets
  - Includes all metrics: impressions, CTR, AWT, retention
  - Smart layout: paste next to video title without overwriting

### Changed
- Added impressions to metrics display (PRE and POST columns)
- Improved export section design to match existing UI patterns
- Simplified helper text for better user guidance

## [1.0.3] - 2025-11-03

### Added
- **DD/MM/YYYY Date Format**: All date inputs now use international date format
  - Auto-formatting as you type (25122024 → 25/12/2024)
  - Date validation on blur
  - Backward compatibility with old YYYY-MM-DD stored dates

### Changed
- Converted all date inputs from HTML5 date pickers to text inputs with DD/MM/YYYY format
- Treatment date input now accepts DD/MM/YYYY format
- All calculated dates display in DD/MM/YYYY format
- Internal calculations still use YYYY-MM-DD for compatibility

### Fixed
- Date ordering logic now compares full timestamps instead of just day numbers
- Prevents YouTube validation errors when setting date ranges
- Logger no longer creates error loops when extension context is invalidated
- Dynamic version display in popup now reads from manifest.json

## [1.0.2] - 2024-10-28

### Fixed
- **Edit Button Functionality**: Custom date editing now works properly
  - Day counts now update automatically when dates are changed
  - Added validation for edited dates (order, overlap, length)
  - Prevents extraction with invalid date ranges
  - Shows clear error messages for invalid edits

### Added
- Real-time validation when manually editing dates
- Automatic day count updates as dates change
- Warning for unequal period lengths after editing
- Comprehensive error messages for invalid date combinations
- Logging of all manual date edits for debugging

### Changed
- Edit button now validates dates when "Done" is clicked
- Extract button is disabled if edited dates are invalid

## [1.0.1] - 2024-10-28

### Fixed
- **Equal Period Comparison**: PRE and POST periods now always have the same length for fair comparison
  - Previously: POST used all available days, PRE got cut off by publish date
  - Now: Uses the shorter of the two available periods for both PRE and POST
  - Example: If 2 days available for PRE and 7 days for POST, both periods use 2 days
- Improved informational messages to explain when period length is limited

### Changed
- Updated date range calculation logic to prioritize comparison fairness over data availability
- Better user feedback when periods are shortened for fair comparison

## [1.0.0] - 2024-10-28

### Initial Release

#### Features
- **Automated Treatment Comparison**: Compare PRE vs POST treatment periods automatically
- **Smart Date Detection**: Automatically detects publish dates in both Basic and Advanced modes
- **Metric Collection**: Captures key YouTube Studio metrics:
  - Views
  - Watch Time
  - Impressions
  - CTR (Click-Through Rate)
  - Average View Duration
- **Video Change Monitoring**: Tracks when users switch between videos
- **Comprehensive Logging**:
  - Detailed activity logs for debugging
  - Error reporting system
  - Log export functionality
- **User-Friendly Interface**:
  - Clean popup UI
  - Clear status messages
  - Easy log access

#### Technical Details
- Works with YouTube Studio Analytics page
- Supports both Basic and Advanced date picker modes
- Automatic retry mechanism for date detection
- Comprehensive error handling

---

## Template for Future Releases

Copy this template when creating a new release:

```markdown
## [X.X.X] - YYYY-MM-DD

### Added
- New feature descriptions

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features (if any)
```
