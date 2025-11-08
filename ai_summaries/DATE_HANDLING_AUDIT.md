# Date Format & Metrics Export Audit

**Date**: 2025-11-08
**Issue**: Inconsistent date formats and missing treatment date ranges in batch export

## Summary

The batch export functionality uses inconsistent date formats and doesn't format the treatment date with full date ranges like the single-video export does. This audit documents all issues and provides a fix plan.

---

## Current Export Formats

### ✅ Single Video Export (popup.js) - CORRECT

**Date Format Function** (line 362-366):
```javascript
function formatDateForExport(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');  // Input: YYYY-MM-DD
  return `${day}.${month}.${year}`;                // Output: DD.MM.YYYY
}
```

**Treatment Date Format** (line 239):
```javascript
const treatmentDate = `Pre - ${formatDateForExport(preRange.start)}-${formatDateForExport(preRange.end)} Post- ${formatDateForExport(postRange.start)}-${formatDateForExport(postRange.end)}`;
```

**Example Output**:
```
Pre - 15.10.2024-29.10.2024 Post- 30.10.2024-13.11.2024
```

**Export Columns** (lines 241-253):
```
1. Treatment Date (with full PRE/POST date ranges)
2. Pre Impressions
3. Post Impressions
4. (empty) - for spreadsheet Change calculation
5. Pre CTR
6. Post CTR
7. (empty) - for spreadsheet Change calculation
8. Pre AWT
9. Post AWT
10. Pre Retention
11. Post Retention
```

---

### ❌ Batch Export (content-batch.js) - NEEDS FIXES

#### Issue 1: Missing Date Range Formatter

**No equivalent of `formatDateForExport()`** - The batch module doesn't have a DD.MM.YYYY formatter.

#### Issue 2: Treatment Date Missing Date Ranges

**Current** (lines 1040, 1108, 1162):
```javascript
result.treatmentDate  // Just "14/11/2024"
```

**Should be**:
```javascript
"Pre - 01.11.2024-14.11.2024 Post- 15.11.2024-28.11.2024"
```

#### Issue 3: Date Ranges Available But Not Used

**The data IS available!** (line 1923-1926 in content-youtube-api.js):
```javascript
return {
  pre: { /* metrics */ },
  post: { /* metrics */ },
  periods: {
    pre: { start: preStart, end: preEnd },   // ✅ Available in YYYY-MM-DD format
    post: { start: postStart, end: postEnd }  // ✅ Available in YYYY-MM-DD format
  }
}
```

**But batch export doesn't use them!**
- `formatCompleteAnalysisTSV()` accesses `result.metrics.equal` but not `result.metrics.equal.periods`
- Same for `formatEqualPeriodsTSV()` and `formatLifetimeTSV()`

#### Issue 4: CSV Export Uses Wrong Format

**CSV Download Columns** (lines 994-1022):
```
URL | Video Title | Video ID | Publish Date | Treatment Date | ...
```

- `Publish Date` uses `YTTreatmentHelper.Utils.formatDate()` which returns YYYY-MM-DD
- `Treatment Date` is just DD/MM/YYYY without ranges

**Should be DD.MM.YYYY for all dates**

---

## Extracted Metrics Comparison

### What's Actually Extracted (content-youtube-api.js lines 1151-1158)

```javascript
{
  impressions: "1,234",
  views: "987",
  awt: "2:34",
  consumption: "45.2%",      // Also called "average percentage viewed"
  ctr: "6.2%",
  stayedToWatch: "62.1%"     // This is shown in some views
}
```

### What's Exported

**Single Video (popup.js)**:
- ✅ Impressions
- ✅ CTR
- ✅ AWT
- ✅ Retention (from separate chart extraction)
- ❌ Views (not included)
- ❌ Stayed to Watch (not included)

**Batch Export (content-batch.js)**:
- ✅ Impressions
- ✅ CTR
- ✅ AWT
- ✅ Retention
- ✅ Views (EXTRA - useful but inconsistent)
- ✅ Stayed to Watch (EXTRA - useful but inconsistent)

**Conclusion**: Batch exports MORE metrics than single-video, which is good, but creates format inconsistency.

---

## Required Fixes

### Fix 1: Add Date Formatter to Batch Module

Add to `content-batch.js`:
```javascript
/**
 * Format date for export (DD.MM.YYYY)
 * Converts YYYY-MM-DD to DD.MM.YYYY
 */
formatDateForExport: function(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}
```

### Fix 2: Store Periods in Batch Results

**Current** (line 787-795):
```javascript
return {
  videoId: video.videoId,
  videoTitle: videoTitle,
  publishDate: YTTreatmentHelper.Utils.formatDate(videoPublishDate),  // ❌ YYYY-MM-DD
  url: video.url,
  status: 'success',
  metrics: metrics,                                                   // ✅ Has periods inside
  treatmentDate: treatmentDate                                       // ❌ Just DD/MM/YYYY
};
```

**Should be**:
```javascript
return {
  videoId: video.videoId,
  videoTitle: videoTitle,
  publishDate: this.formatDateForExport(YTTreatmentHelper.Utils.formatDate(videoPublishDate)),  // ✅ DD.MM.YYYY
  url: video.url,
  status: 'success',
  metrics: metrics,
  treatmentDate: treatmentDate,
  dateRanges: {  // ✅ ADD THIS
    pre: metrics.equal?.periods?.pre || metrics.periods?.pre,
    post: metrics.equal?.periods?.post || metrics.periods?.post
  }
};
```

### Fix 3: Format Treatment Date with Ranges

Update all export functions to build treatment date string:

```javascript
// Build treatment date with ranges (matching single-video format)
let treatmentDateDisplay = result.treatmentDate || '';

if (result.dateRanges?.pre && result.dateRanges?.post) {
  treatmentDateDisplay = `Pre - ${this.formatDateForExport(result.dateRanges.pre.start)}-${this.formatDateForExport(result.dateRanges.pre.end)} Post- ${this.formatDateForExport(result.dateRanges.post.start)}-${this.formatDateForExport(result.dateRanges.post.end)}`;
}
```

### Fix 4: Update All Export Functions

Files to update:
- `formatCompleteAnalysisTSV()` (line 993)
- `formatCompleteAnalysisTSVWithoutHeaders()` (line 1205)
- `formatEqualPeriodsTSV()` (line 1075)
- `formatEqualPeriodsTSVWithoutHeaders()` (line 1254)
- `formatLifetimeTSV()` (line 1133)
- `formatLifetimeTSVWithoutHeaders()` (line 1292)
- `formatBatchResultsForExport()` (line 1485)

### Fix 5: Update History Export

Ensure batch history also stores and exports date ranges properly (lines 1381-1480).

---

## Implementation Steps

### Step 1: Add formatter function
Add `formatDateForExport()` to `YTTreatmentHelper.BatchMode` object

### Step 2: Update extractVideoMetrics
Modify line 787-795 to:
- Convert publishDate to DD.MM.YYYY format
- Add `dateRanges` property with periods from metrics

### Step 3: Update all TSV formatters
For each export function:
- Build treatment date string with full ranges
- Use `formatDateForExport()` for all dates
- Replace `result.treatmentDate` with formatted string

### Step 4: Update batch history
Ensure history save/load preserves date ranges

### Step 5: Test all export paths
- Copy to clipboard
- Download CSV
- History export
- All three modes (complete, equal-periods, lifetime)

---

## Testing Checklist

After implementation:

- [ ] Batch export CSV: All dates in DD.MM.YYYY format
- [ ] Batch export CSV: Treatment date shows full ranges
- [ ] Batch copy to clipboard: Matches single-video format
- [ ] Batch history export: Uses DD.MM.YYYY format
- [ ] Complete analysis mode: Correct format
- [ ] Equal periods mode: Correct format
- [ ] Lifetime mode: Correct format
- [ ] Publish date: DD.MM.YYYY format
- [ ] All metrics present and aligned with single-video export

---

## Expected Output After Fixes

### Complete Analysis CSV:
```
URL	Video Title	Video ID	Publish Date	Treatment Date	Equal Pre Impressions	Equal Post Impressions	...
https://...	My Video	ABC123	15.10.2024	Pre - 01.10.2024-15.10.2024 Post- 16.10.2024-30.10.2024	1234	5678	...
```

### Copy to Clipboard (Equal Periods):
```
My Video	Pre - 01.10.2024-15.10.2024 Post- 16.10.2024-30.10.2024	1234	5678		6.2%	7.1%		2:34	3:12	45.2%	52.1%	987	1234
```

**Note**: Copy format omits URL/Video ID for easy pasting into existing spreadsheets, just like single-video export.

---

## Conclusion

**Status**: ❌ INCONSISTENT - Batch export doesn't match single-video format

**Root Cause**: Missing date formatter and not using available `periods` data

**Impact**: Medium - Data is correct but format makes it harder to paste into spreadsheets

**Effort**: Low - All data is available, just needs formatting

**Priority**: High - User has specifically requested this fix
