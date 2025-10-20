# YouTube Treatment Comparison Helper - User Guide

## 🎉 Phase 1 + Phase 2 Integration Complete!

Your extension now has **automatic metrics extraction** built right into the UI!

## Features

### Phase 1: Date Range Calculator ✅
- Calculate PRE and POST periods based on treatment date
- Copy dates easily with one click
- View duration of each period

### Phase 2: Auto-Extract Metrics ✅ **NEW!**
- Automatically extract 4 key metrics
- Compare PRE vs POST side-by-side
- Copy all metrics with one click

## How to Use

### Step 1: Install the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension` folder

### Step 2: Navigate to YouTube Studio

1. Go to https://studio.youtube.com
2. Look for the **"Treatment Comparison"** button in the top-right
3. Click it to open the helper panel

### Step 3: Calculate Date Ranges

1. **Enter Treatment Date**: Select the date when you made changes to your video
2. **Click "Calculate Periods"**: The extension calculates PRE and POST periods
   - PRE Period: Same number of days BEFORE treatment
   - POST Period: Treatment day to today

### Step 4: Auto-Extract Metrics (NEW!)

#### Option A: Automatic Extraction (Recommended)

1. **Navigate to Advanced Mode**:
   - Click on any video in YouTube Studio
   - Go to Analytics
   - Click "See more" or "Advanced mode"
   - Make sure URL contains `/explore?`

2. **Click "🚀 Auto-Extract Metrics"**

3. **Watch the Magic!** ✨
   - The extension will:
     - Select the 4 required metrics
     - Set PRE date range
     - Extract PRE metrics
     - Set POST date range
     - Extract POST metrics
     - Display results side-by-side

4. **View Results**:
   ```
   PRE Period        |  POST Period
   ------------------|------------------
   Views: 123        |  Views: 456
   CTR: 5.5%         |  CTR: 6.2%
   AWT: 0:45         |  AWT: 0:50
   Consumption: 40%  |  Consumption: 45%
   ```

5. **Copy Results**: Click "Copy All Metrics" to copy to clipboard

#### Option B: Manual Extraction

If you prefer to do it manually or the auto-extract fails:

1. Copy PRE start date → Apply to YouTube Studio date filter
2. Copy PRE end date → Apply to YouTube Studio date filter
3. Note down the metrics
4. Copy POST start date → Apply to YouTube Studio date filter
5. Copy POST end date → Apply to YouTube Studio date filter
6. Note down the metrics
7. Compare manually

## The 4 Metrics

| Metric | Description | Example |
|--------|-------------|---------|
| **Views** | Total number of views | 123 |
| **CTR** | Click-through rate (Impressions CTR) | 5.9% |
| **AWT** | Average Watch Time (Average view duration) | 0:45 |
| **Consumption** | Average percentage viewed | 40.0% |

## Tips & Tricks

### Best Practices

1. **Wait for results**: Auto-extraction takes ~15 seconds
2. **Use Advanced Mode**: Required for auto-extraction
3. **Check the dates**: Verify PRE/POST periods make sense
4. **Save treatment date**: It's saved automatically for next time

### Keyboard Shortcuts

- **Ctrl+C** on metric values: Manually copy individual values
- **Click "Copy All Metrics"**: Copy formatted text with all metrics

### Troubleshooting

**"Please navigate to Advanced Mode first"**
- Solution: Go to video Analytics → Click "Advanced mode"

**"Please calculate date ranges first"**
- Solution: Enter treatment date and click "Calculate Periods"

**Auto-extract fails or times out**
- Check you're on a video analytics page (not channel analytics)
- Refresh the page and try again
- Use manual extraction as fallback

**No data (shows "—")**
- Video has no activity in that time period
- This is normal for old videos or future dates

**Wrong metrics extracted**
- Make sure you're on the correct video
- Check the date ranges are correct
- Try refreshing and extracting again

## Technical Details

### What Happens During Auto-Extraction?

1. **Metric Selection** (~3 seconds)
   - Opens metrics selector dialog
   - Deselects all metrics
   - Selects Views, CTR, AWT, Consumption
   - Clicks Apply

2. **PRE Period Extraction** (~6 seconds)
   - Opens date period dropdown
   - Clicks "Custom"
   - Enters PRE start and end dates
   - Clicks Apply
   - Waits for table to refresh
   - Extracts values from table

3. **POST Period Extraction** (~6 seconds)
   - Opens date period dropdown again
   - Clicks "Custom"
   - Enters POST start and end dates
   - Clicks Apply
   - Waits for table to refresh
   - Extracts values from table

4. **Results Display** (<1 second)
   - Shows PRE and POST metrics side-by-side
   - Enables "Copy All Metrics" button
   - Saves results to browser storage

### Data Storage

The extension stores:
- **Last treatment date**: So you don't have to re-enter it
- **Last calculated ranges**: PRE/POST periods
- **Last extracted metrics**: For future reference

All data is stored **locally in your browser** (not sent to any server).

## Workflow Example

### Scenario: You changed a video thumbnail on October 15, 2025

1. **Open the extension panel**
   - Click "Treatment Comparison" button

2. **Enter treatment date**: October 15, 2025

3. **Calculate periods**: Click "Calculate Periods"
   - Result:
     - Days Since Treatment: 5 days
     - PRE: Oct 10 - Oct 14 (5 days)
     - POST: Oct 15 - Oct 19 (6 days, including treatment)

4. **Navigate to Advanced Mode**
   - Go to the video you changed
   - Click Analytics → Advanced mode

5. **Auto-extract**: Click "🚀 Auto-Extract Metrics"

6. **Wait ~15 seconds** while extraction runs

7. **View results**:
   ```
   PRE (before thumbnail)  |  POST (after thumbnail)
   Views: 100              |  Views: 150         (+50%)
   CTR: 4.5%               |  CTR: 6.8%          (+51%)
   AWT: 0:42               |  AWT: 0:55          (+31%)
   Consumption: 35%        |  Consumption: 45%   (+29%)
   ```

8. **Copy results**: Click "Copy All Metrics" and paste into your report

## FAQs

**Q: Can I use this for Shorts?**
A: Yes! The auto-extraction works for both regular videos and Shorts.

**Q: Can I extract metrics for multiple videos?**
A: Currently one video at a time. Bulk extraction coming in future updates.

**Q: What if I made multiple changes on different dates?**
A: Enter the most recent/important treatment date. For multiple experiments, extract each separately.

**Q: Does this work on Firefox/Safari?**
A: Currently Chrome only. Other browsers coming soon.

**Q: Is my data sent to any server?**
A: No! Everything runs locally in your browser. No data is sent anywhere.

**Q: Can I export to CSV/Excel?**
A: Not yet, but you can copy the metrics and paste into Excel. CSV export coming in Phase 3.

## What's Next?

### Phase 3: Airtable Integration (Coming Soon)

- Automatic upload to Airtable
- Track multiple videos
- Historical comparison
- Team collaboration

### Future Features

- Bulk extraction for multiple videos
- CSV/Excel export
- Custom metrics selection
- Date range presets
- Comparison charts

## Support

### Need Help?

1. Check this guide first
2. Check browser console for error messages (F12 → Console)
3. Create an issue on GitHub
4. Contact your team lead

### Report Bugs

Include:
1. What you were trying to do
2. What happened (error message)
3. Screenshot if possible
4. Browser console output (F12 → Console)

## Credits

Built with ❤️ for the CrazyTok team

- **Version**: 1.0.0 (Phase 1 + Phase 2)
- **Last Updated**: October 2025
- **Developer**: Claude + Siddharth
