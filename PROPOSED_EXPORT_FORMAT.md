# Proposed Batch Export Format - Simplified

## Design Principles

- **Treatment date is just the treatment date** (e.g., `14.11.2024`)
- **Date ranges merged with hyphen** (e.g., `01.11.2024-14.11.2024`)
- **All dates in DD.MM.YYYY format**
- **Clear grouping**: Metadata → Date ranges → Metrics

---

## Complete Analysis Mode Headers

**Has both equal periods + lifetime data**

```
URL	Video Title	Video ID	Publish Date	Treatment Date	Equal Pre Period	Equal Post Period	Equal Pre Impressions	Equal Post Impressions	Equal Pre CTR	Equal Post CTR	Equal Pre Views	Equal Post Views	Equal Pre AWT	Equal Post AWT	Equal Pre Retention	Equal Post Retention	Equal Pre Stayed to Watch	Equal Post Stayed to Watch	Lifetime Pre Period	Lifetime Post Period	Lifetime Pre Impressions	Lifetime Post Impressions	Lifetime Pre CTR	Lifetime Post CTR	Lifetime Pre Views	Lifetime Post Views	Lifetime Pre AWT	Lifetime Post AWT
```

### Complete Analysis Sample Data:

```
URL	Video Title	Video ID	Publish Date	Treatment Date	Equal Pre Period	Equal Post Period	Equal Pre Impressions	Equal Post Impressions	Equal Pre CTR	Equal Post CTR	Equal Pre Views	Equal Post Views	Equal Pre AWT	Equal Post AWT	Equal Pre Retention	Equal Post Retention	Equal Pre Stayed to Watch	Equal Post Stayed to Watch	Lifetime Pre Period	Lifetime Post Period	Lifetime Pre Impressions	Lifetime Post Impressions	Lifetime Pre CTR	Lifetime Post CTR	Lifetime Pre Views	Lifetime Post Views	Lifetime Pre AWT	Lifetime Post AWT
https://studio.youtube.com/video/ABC123/analytics	My Awesome Video	ABC123	15.10.2024	14.11.2024	01.11.2024-14.11.2024	15.11.2024-28.11.2024	1,234	5,678	4.5%	6.2%	987	4,123	2:34	3:12	45.2%	52.1%	62.1%	68.3%	15.10.2024-14.11.2024	14.11.2024-05.12.2024	12,345	8,901	5.1%	6.8%	10,234	7,456	2:48	3:05
https://studio.youtube.com/video/XYZ789/analytics	Another Great Video	XYZ789	20.09.2024	01.11.2024	18.10.2024-01.11.2024	02.11.2024-15.11.2024	2,456	7,890	3.8%	5.9%	1,234	5,678	3:21	4:05	38.7%	48.2%	58.9%	65.4%	20.09.2024-01.11.2024	01.11.2024-05.12.2024	15,678	12,345	4.2%	5.5%	12,456	9,876	3:10	3:55
```

**Column count: 29 columns** (was 33, saved 4 columns)

---

## Equal Periods Mode Headers

**Only equal-length PRE and POST periods**

```
URL	Video Title	Video ID	Publish Date	Treatment Date	Pre Period	Post Period	Pre Impressions	Post Impressions	Pre CTR	Post CTR	Pre Views	Post Views	Pre AWT	Post AWT	Pre Retention	Post Retention	Pre Stayed to Watch	Post Stayed to Watch
```

### Equal Periods Sample Data:

```
URL	Video Title	Video ID	Publish Date	Treatment Date	Pre Period	Post Period	Pre Impressions	Post Impressions	Pre CTR	Post CTR	Pre Views	Post Views	Pre AWT	Post AWT	Pre Retention	Post Retention	Pre Stayed to Watch	Post Stayed to Watch
https://studio.youtube.com/video/ABC123/analytics	My Awesome Video	ABC123	15.10.2024	14.11.2024	01.11.2024-14.11.2024	15.11.2024-28.11.2024	1,234	5,678	4.5%	6.2%	987	4,123	2:34	3:12	45.2%	52.1%	62.1%	68.3%
https://studio.youtube.com/video/XYZ789/analytics	Another Great Video	XYZ789	20.09.2024	01.11.2024	18.10.2024-01.11.2024	02.11.2024-15.11.2024	2,456	7,890	3.8%	5.9%	1,234	5,678	3:21	4:05	38.7%	48.2%	58.9%	65.4%
```

**Column count: 19 columns** (was 21, saved 2 columns)

---

## Lifetime Mode Headers

**From publish to treatment, treatment to today**

```
URL	Video Title	Video ID	Publish Date	Treatment Date	Pre Period	Post Period	Pre Impressions	Post Impressions	Pre CTR	Post CTR	Pre Views	Post Views	Pre AWT	Post AWT
```

### Lifetime Sample Data:

```
URL	Video Title	Video ID	Publish Date	Treatment Date	Pre Period	Post Period	Pre Impressions	Post Impressions	Pre CTR	Post CTR	Pre Views	Post Views	Pre AWT	Post AWT
https://studio.youtube.com/video/ABC123/analytics	My Awesome Video	ABC123	15.10.2024	14.11.2024	15.10.2024-14.11.2024	14.11.2024-05.12.2024	12,345	8,901	5.1%	6.8%	10,234	7,456	2:48	3:05
https://studio.youtube.com/video/XYZ789/analytics	Another Great Video	XYZ789	20.09.2024	01.11.2024	20.09.2024-01.11.2024	01.11.2024-05.12.2024	15,678	12,345	4.2%	5.5%	12,456	9,876	3:10	3:55
```

**Column count: 15 columns** (was 17, saved 2 columns)

---

## Column Ordering Logic

### Metadata Columns (always first):
1. URL
2. Video Title
3. Video ID
4. Publish Date (DD.MM.YYYY)
5. Treatment Date (DD.MM.YYYY)

### Date Range Columns (for equal periods):
6. Pre Period (DD.MM.YYYY-DD.MM.YYYY) *or* Equal Pre Period
7. Post Period (DD.MM.YYYY-DD.MM.YYYY) *or* Equal Post Period

### Metrics Columns (grouped):
8-9. Impressions (Pre, Post)
10-11. CTR (Pre, Post)
12-13. Views (Pre, Post)
14-15. AWT (Pre, Post)
16-17. Retention (Pre, Post) - *only in equal-periods*
18-19. Stayed to Watch (Pre, Post) - *only in equal-periods*

### Lifetime Date Range (complete analysis only):
20. Lifetime Pre Period (DD.MM.YYYY-DD.MM.YYYY)
21. Lifetime Post Period (DD.MM.YYYY-DD.MM.YYYY)

### Lifetime Metrics (complete analysis only):
22-23. Lifetime Impressions (Pre, Post)
24-25. Lifetime CTR (Pre, Post)
26-27. Lifetime Views (Pre, Post)
28-29. Lifetime AWT (Pre, Post)

---

## Benefits

✅ **Simple treatment date** - Just `14.11.2024` instead of complex range string
✅ **Cleaner date ranges** - `01.11.2024-14.11.2024` instead of 2 columns
✅ **Fewer columns** - Easier to view and work with
✅ **Still splittable** - Excel "Text to Columns" with `-` delimiter if needed
✅ **Consistent format** - All dates in DD.MM.YYYY
✅ **Clear structure** - Grouped by metadata → dates → metrics

---

## Implementation Notes

### Column Counts:
- **formatCompleteAnalysisTSV()** - 29 columns (was 33)
- **formatEqualPeriodsTSV()** - 19 columns (was 21)
- **formatLifetimeTSV()** - 15 columns (was 17)

### Date Formatting:
- All dates formatted with `formatDateForExport()` → DD.MM.YYYY
- Treatment date: `result.treatmentDate` (already in DD/MM/YYYY)
- Period ranges: `${formatDateForExport(start)}-${formatDateForExport(end)}`

### Date Range Examples:
```javascript
// Equal Pre Period
const equalPrePeriod = `${this.formatDateForExport(result.dateRanges.pre.start)}-${this.formatDateForExport(result.dateRanges.pre.end)}`;
// Result: "01.11.2024-14.11.2024"

// Lifetime Post Period (for complete analysis)
const lifetimePostPeriod = `${this.formatDateForExport(result.metrics.lifetime.periods.post.start)}-${this.formatDateForExport(result.metrics.lifetime.periods.post.end)}`;
// Result: "14.11.2024-05.12.2024"
```
