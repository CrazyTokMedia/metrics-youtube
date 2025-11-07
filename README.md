# YouTube Treatment Comparison Helper

A Chrome extension that automates PRE vs POST treatment period comparison in YouTube Studio Analytics. Extract and compare metrics before and after a treatment (thumbnail change, title change, etc.) with a single click.

## 📥 Download

[Download v2.0.0](https://github.com/CrazyTokMedia/metrics-youtube/releases/download/v2.0.0/youtube-treatment-helper-v2.0.0.zip)

## ✨ Features

- **Automatic Date Calculation**: Calculates equal-length PRE and POST periods based on your treatment date
- **One-Click Extraction**: Extracts all metrics with a single button click
- **Comprehensive Metrics**: Captures views, watch time, CTR, average view duration, and more
- **Retention Analysis**: Optional audience retention metrics for detailed analysis
- **Export Ready**: JSON format ready for Airtable, spreadsheets, or data analysis tools
- **Smart Date Handling**: Automatically detects YouTube's date format (DD/MM/YYYY or MM/DD/YYYY)
- **Reliable Logging**: Detailed logs for debugging and troubleshooting

## 📦 Installation

1. Download the latest release ZIP from the link above
2. Extract the ZIP file to a folder on your computer
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right corner)
5. Click "Load unpacked" and select the extracted folder
6. The extension icon will appear in your Chrome toolbar

## 🚀 Usage

1. Navigate to a video's Analytics page in YouTube Studio
2. Click the extension icon to open the helper panel
3. Select your treatment date (when you made the change)
4. Click **"Calculate Dates"** to see the PRE/POST periods
5. Click **"Extract Metrics"** to automatically fetch the data
6. Copy the results or download logs via the extension popup

### Treatment Date
The treatment date is when you made a change to your video (new thumbnail, title edit, etc.). The extension will:
- Calculate equal-length periods before and after this date
- Automatically account for video publish date
- Use the most recent data available from YouTube

## 📊 Metrics Captured

### Primary Metrics
- **Views** - Total video views
- **Impressions** - How often your thumbnail was shown
- **Average Watch Time** - Average time viewers watched (seconds)
- **Average View Duration** - Average % of video watched
- **Impressions CTR** - Click-through rate on impressions
- **External Views** - Views from outside YouTube

### Optional Metrics
- **Audience Retention** - Retention % at specific time point
- **Retention Time Point** - Where retention is measured

## 🛠️ Development

### Project Structure

```
yt_metrics_airtable/
├── extension/          # Chrome extension source code
│   ├── content.js     # Main content script with extraction logic
│   ├── logger.js      # Logging and debugging system
│   ├── manifest.json  # Extension manifest (v3)
│   ├── popup.html     # Extension popup UI
│   ├── popup.js       # Popup logic and log export
│   ├── styles.css     # Extension styles
│   └── icons/         # Extension icons
├── scripts/           # Build and packaging scripts
├── create_release.py  # Automated GitHub release tool
├── CHANGELOG.md       # Version history
└── README.md          # This file
```

### Creating a Release

We use an automated Python script to create GitHub releases:

```bash
# Auto-detect version from manifest.json and create release
python create_release.py --auto --update-readme

# Create a draft release first (for review)
python create_release.py --auto --draft

# Only create the ZIP file (no GitHub release)
python create_release.py --zip-only --auto
```

**Requirements:**
- Python 3.x
- `requests` library: `pip install requests`
- GitHub personal access token in `.env` file: `GITHUB_TOKEN=ghp_xxx`

### Release Script Options

```bash
--auto              # Auto-detect version from manifest.json
--version X.X.X     # Specify version manually
--draft             # Create as draft release
--update-readme     # Update README with download link
--template default  # Use formatted release body template
--zip-only          # Only create ZIP, skip GitHub release
```

## 📖 Technical Details

### Date Format Detection

The extension automatically detects whether YouTube Studio is using DD/MM/YYYY or MM/DD/YYYY format by:
1. Reading cached dates from YouTube's date picker UI
2. Analyzing which format is in use (if day > 12, format is obvious)
3. Defaulting to DD/MM/YYYY (international standard) if ambiguous
4. Automatically retrying with alternate format if validation fails

### Smart Date Ordering

To prevent YouTube validation errors, the extension intelligently determines whether to set the start or end date first:
- Analyzes current cached dates vs. target dates
- Sets dates in order that expands the range (not contracts)
- Compares full timestamps, not just day numbers
- Prevents "start date after end date" validation errors

## 🐛 Troubleshooting

### Extension Not Working
1. Refresh the YouTube Studio page (F5)
2. Reload the extension at `chrome://extensions/`
3. Check the browser console (F12) for error messages
4. Export logs from the extension popup for debugging

### Date Validation Errors
- Ensure your treatment date is **after the video was published**
- Make sure dates are **not in the future**
- YouTube analytics data is typically available up to **2 days ago**

### Missing Metrics
- Some metrics may not be available for all videos
- Ensure you're on the correct **Analytics tab** in YouTube Studio
- Wait for the page to **fully load** before clicking Extract
- Check if the video has enough views/data for certain metrics

### Extension Context Errors
If you see "Extension context invalidated":
1. This happens when the extension is reloaded while running
2. Simply **refresh the YouTube Studio page** (F5)
3. The extension will work normally again

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and release notes.

## 🔗 Links

- **Issues**: [GitHub Issues](https://github.com/CrazyTokMedia/metrics-youtube/issues)
- **Source Code**: [GitHub Repository](https://github.com/CrazyTokMedia/metrics-youtube)
- **Latest Release**: [v1.0.3](https://github.com/CrazyTokMedia/metrics-youtube/releases/tag/v1.0.3)

## 📄 License

Internal tool for CrazyTok Media. All rights reserved.

## 🙏 Credits

Developed by CrazyTok Media with assistance from Claude Code.

---

**Last Updated**: November 2025
