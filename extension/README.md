# YouTube Treatment Comparison Helper - Chrome Extension

## Overview

This Chrome extension automates the process of comparing YouTube video performance metrics for PRE vs POST treatment periods. It's designed for content strategists who want to analyze the impact of video treatments (titles, thumbnails, descriptions) on performance.

## Current Version: Phase 1 - Manual Helper

**Status**: Testing prototype
**Features**:
- Calculate symmetric PRE/POST date ranges based on treatment date
- One-click copy of date ranges to clipboard
- Persistent storage of last treatment date
- Clean, floating UI panel in YouTube Studio

## Installation

### For Testing (Developer Mode)

1. **Download/Clone** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `extension` folder from this project
6. The extension should now appear in your extensions list

### Verify Installation

- You should see "YouTube Treatment Comparison Helper" in your extensions
- Navigate to [YouTube Studio](https://studio.youtube.com)
- Look for the **"Treatment Comparison"** button in the top-right corner

## Usage

### Step 1: Open YouTube Studio Analytics

1. Go to [YouTube Studio](https://studio.youtube.com)
2. Navigate to **Analytics** for a specific video or your channel
3. You should see a purple **"Treatment Comparison"** button in the top-right

### Step 2: Calculate Date Ranges

1. Click the **"Treatment Comparison"** button
2. A floating panel will appear on the right side
3. Enter your **Treatment Date** (the date you made changes to the video)
4. Click **"Calculate Periods"**

### Step 3: Apply to YouTube Studio

The extension will calculate and display:

**PRE Period** (before treatment):
- Start date: X days before treatment
- End date: Day before treatment
- Duration: X days

**POST Period** (after treatment):
- Start date: Treatment date
- End date: Today
- Duration: X days

### Step 4: Manual Comparison

1. **Copy PRE dates**: Click "Copy" buttons next to each date
2. **Apply to YouTube Studio**: Set the date filter to PRE period
3. **Note metrics**: Write down Views, Watch Time, CTR, etc.
4. **Copy POST dates**: Click "Copy" buttons
5. **Apply to YouTube Studio**: Set the date filter to POST period
6. **Compare**: Compare the metrics manually

## How It Works

### Date Calculation Logic

```
Treatment Date: January 15, 2025
Today: January 25, 2025
Days Since Treatment: 10 days

PRE Period:
  Start: January 5, 2025  (10 days before treatment)
  End: January 14, 2025   (day before treatment)
  Duration: 10 days

POST Period:
  Start: January 15, 2025 (treatment day)
  End: January 25, 2025   (today)
  Duration: 11 days
```

This ensures **symmetric comparison** - equal time periods before and after the treatment.

## Files Structure

```
extension/
├── manifest.json       # Extension configuration
├── content.js          # Main logic (injected into YouTube Studio)
├── styles.css          # UI styling
├── popup.html          # Extension popup (click extension icon)
├── icons/              # Extension icons (to be added)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

## Permissions Explained

### Required Permissions

- **activeTab**: Access the currently active YouTube Studio tab
- **storage**: Save your last treatment date for convenience
- **scripting**: Inject the helper panel into YouTube Studio pages
- **host_permissions** (studio.youtube.com): Only works on YouTube Studio

### Privacy

- **No data is sent externally** - everything runs locally in your browser
- **No tracking** - we don't collect any usage data
- **No API calls** - doesn't communicate with any servers
- Treatment dates are stored locally using Chrome's storage API

## Troubleshooting

### Extension button not appearing?

1. **Refresh YouTube Studio** - Press F5 or Ctrl+R
2. **Check extension is enabled** - Go to `chrome://extensions/`
3. **Verify you're on studio.youtube.com** - Extension only works on YouTube Studio, not regular YouTube
4. **Check browser console** - Press F12, look for errors

### Panel not opening?

1. **Try refreshing the page**
2. **Disable and re-enable the extension**
3. **Check for JavaScript errors** in browser console (F12)

### Dates not calculating correctly?

1. **Verify treatment date is in the past** - Can't calculate for future dates
2. **Check date format** - Should be YYYY-MM-DD
3. **Try a different browser** - Test in incognito mode

## Development Notes

### Phase 1 Limitations

This is the **Manual Helper** version. It doesn't automatically:
- Click date filters
- Extract metrics from the page
- Display comparison charts
- Store historical data

These features are planned for Phase 2 and Phase 3.

### Technology Used

- **Vanilla JavaScript** - No frameworks, lightweight
- **Chrome Extension Manifest V3** - Latest extension standard
- **Chrome Storage API** - Persistent storage
- **CSS3** - Modern styling with gradients and animations

## Roadmap

### Phase 2: Semi-Automatic (Planned)

- Auto-detect date filter elements in YouTube Studio
- Programmatically change date ranges
- One-click switching between PRE and POST periods
- Extract visible metrics from the page

### Phase 3: Fully Automatic (Planned)

- Auto-extract metrics for both periods
- Display side-by-side comparison
- Calculate percentage changes
- Export to CSV or Airtable
- Multiple video comparison

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Button appears in YouTube Studio
- [ ] Panel opens and closes correctly
- [ ] Date calculation is accurate
- [ ] Copy buttons work
- [ ] Last treatment date is saved
- [ ] Works on video analytics page
- [ ] Works on channel analytics page
- [ ] Works with private videos
- [ ] Works with brand account privileges

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for errors (F12)
3. Test in incognito mode to rule out conflicts
4. Verify you're using Chrome version 88+

## Version History

### v1.0.0 - Phase 1 (Current)
- Initial release
- Manual date calculation helper
- Floating UI panel
- Copy-to-clipboard functionality
- Persistent treatment date storage

---

**Built with** by CrazyTok Media
**License**: [To be determined]
**Last Updated**: January 2025
