# Export Format Consistency Analysis

## Current State (Inconsistencies Found)

### Single Video Export (popup.js)
**Current Format:**
```
Treatment Date (complex) | Pre Impressions | Post Impressions | empty | Pre CTR | Post CTR | empty | Pre AWT | Post AWT | Pre Retention | Post Retention
```

**Treatment Date Format:** `Pre - 01.11.2024-14.11.2024 Post- 15.11.2024-28.11.2024` (complex)

**Metrics Exported:**
- ✅ Impressions
- ✅ CTR
- ✅ AWT
- ✅ Retention
- ❌ Views (NOT included)
- ❌ Stayed to Watch (NOT included)

**Column Count:** 11 columns (with empty columns for Change calculations)

---

### Batch Equal Periods Export (content-batch.js)
**Current Format:**
```
URL | Video Title | Video ID | Publish Date | Treatment Date | Pre Period | Post Period | Pre Impressions | Post Impressions | Pre CTR | Post CTR | Pre Views | Post Views | Pre AWT | Post AWT | Pre Retention | Post Retention | Pre Stayed to Watch | Post Stayed to Watch
```

**Treatment Date Format:** `14.11.2024` (simple)

**Date Periods:** `01.11.2024-14.11.2024` (hyphenated)

**Metrics Exported:**
- ✅ Impressions
- ✅ CTR
- ✅ Views (INCLUDED)
- ✅ AWT
- ✅ Retention
- ✅ Stayed to Watch (INCLUDED)

**Column Count:** 19 columns (full CSV export)

---

## Inconsistencies Identified

### 1. Treatment Date Format
- ❌ **Single Video**: Uses complex format with full date ranges embedded
- ✅ **Batch**: Uses simple DD/MM/YYYY format

### 2. Date Period Columns
- ❌ **Single Video**: No separate Pre Period / Post Period columns
- ✅ **Batch**: Has separate `Pre Period` and `Post Period` columns

### 3. Metrics Exported
- ❌ **Single Video**: Missing Views and Stayed to Watch
- ✅ **Batch**: Includes all 6 metrics

### 4. Empty Columns
- ❌ **Single Video**: Has empty columns for Change calculations
- ✅ **Batch**: No empty columns (clean export)

---

## Recommended Unified Format

### For Copy to Clipboard (Single Video & Batch History)

**Goal**: Optimized for pasting into existing spreadsheets

**Format:**
```
Treatment Date | Pre Period | Post Period | Pre Impressions | Post Impressions | empty | Pre CTR | Post CTR | empty | Pre Views | Post Views | empty | Pre AWT | Post AWT | empty | Pre Retention | Post Retention | empty | Pre Stayed to Watch | Post Stayed to Watch
```

**Column Count:** 20 columns

**Rationale:**
- Simple treatment date for sorting
- Separate period columns for reference
- Empty columns allow spreadsheet formulas for % change
- All metrics included for completeness

---

### For CSV Download (Batch Mode Only)

**Format:**
```
URL | Video Title | Video ID | Publish Date | Treatment Date | Pre Period | Post Period | Pre Impressions | Post Impressions | Pre CTR | Post CTR | Pre Views | Post Views | Pre AWT | Post AWT | Pre Retention | Post Retention | Pre Stayed to Watch | Post Stayed to Watch
```

**Column Count:** 19 columns

**Rationale:**
- Includes metadata (URL, Video ID) for reference
- No empty columns (calculations done in spreadsheet)
- All metrics included

---

## Required Changes

### 1. Update popup.js (Single Video Export)

**File:** `extension/popup.js`
**Lines:** ~239-253

**Change from:**
```javascript
const treatmentDate = `Pre - ${formatDateForExport(preRange.start)}-${formatDateForExport(preRange.end)} Post- ${formatDateForExport(postRange.start)}-${formatDateForExport(postRange.end)}`;

exportData = [
  treatmentDate,
  metrics.pre.impressions || '',
  metrics.post.impressions || '',
  '',
  metrics.pre.ctr || '',
  metrics.post.ctr || '',
  '',
  metrics.pre.awt || '',
  metrics.post.awt || '',
  metrics.pre.retention || '',
  metrics.post.retention || ''
].join('\t');
```

**Change to:**
```javascript
const treatmentDate = entry.treatmentDate || ''; // Simple DD/MM/YYYY
const prePeriod = `${formatDateForExport(preRange.start)}-${formatDateForExport(preRange.end)}`;
const postPeriod = `${formatDateForExport(postRange.start)}-${formatDateForExport(postRange.end)}`;

exportData = [
  treatmentDate,
  prePeriod,
  postPeriod,
  metrics.pre.impressions || '',
  metrics.post.impressions || '',
  '',
  metrics.pre.ctr || '',
  metrics.post.ctr || '',
  '',
  metrics.pre.views || '',
  metrics.post.views || '',
  '',
  metrics.pre.awt || '',
  metrics.post.awt || '',
  '',
  metrics.pre.retention || '',
  metrics.post.retention || '',
  '',
  metrics.pre.stayedToWatch || '',
  metrics.post.stayedToWatch || ''
].join('\t');
```

### 2. Ensure Treatment Date is Stored

Single video extraction should store the treatment date in history entries as simple DD/MM/YYYY format.

---

## Expected Output After Fixes

### Single Video Export (Clipboard):
```
14.11.2024	01.11.2024-14.11.2024	15.11.2024-28.11.2024	1,234	5,678		4.5%	6.2%		987	4,123		2:34	3:12		45.2%	52.1%		62.1%	68.3%
```

### Batch Equal Periods Export (Clipboard, no headers):
```
My Video	14.11.2024	01.11.2024-14.11.2024	15.11.2024-28.11.2024	1,234	5,678		4.5%	6.2%		987	4,123		2:34	3:12		45.2%	52.1%		62.1%	68.3%
```

**Note:** Batch includes video title, single-video doesn't (assumes title is already in spreadsheet)

### Batch CSV Download (with headers):
```
URL	Video Title	Video ID	Publish Date	Treatment Date	Pre Period	Post Period	Pre Impressions	Post Impressions	Pre CTR	Post CTR	Pre Views	Post Views	Pre AWT	Post AWT	Pre Retention	Post Retention	Pre Stayed to Watch	Post Stayed to Watch
https://...	My Video	ABC123	15.10.2024	14.11.2024	01.11.2024-14.11.2024	15.11.2024-28.11.2024	1,234	5,678	4.5%	6.2%	987	4,123	2:34	3:12	45.2%	52.1%	62.1%	68.3%
```

---

## Testing Checklist

After implementing changes:

- [ ] Single video export has 20 columns
- [ ] Single video export includes Views and Stayed to Watch
- [ ] Single video export uses simple treatment date
- [ ] Single video export has Pre/Post Period columns
- [ ] Batch clipboard export matches single video format (except video title)
- [ ] All dates use DD.MM.YYYY format
- [ ] Empty columns are consistent across formats
- [ ] Batch CSV includes all metadata columns
