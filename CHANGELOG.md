# Changelog

All notable changes to the YouTube Treatment Comparison Helper will be documented here.

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
