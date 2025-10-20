# Quick Start Guide - Copy & Paste Ready

## Your Existing Credentials

### API Key (Already Working)
```
GEMINI_API_KEY=AIzaSyDppglgSnlgiq8YSNTuKhqL-oxUZVlG8nU
```

**Status**: Already in your `.env` file in parent directory

**Works for**: YouTube Data API v3 (public video data, transcripts, metadata)

---

## Copy This Folder To Another Project

To use this setup in another project:

### Step 1: Copy the entire folder
```bash
cp -r youtube-analytics-api-setup /path/to/your/other/project/
```

### Step 2: Install dependencies
```bash
cd /path/to/your/other/project/youtube-analytics-api-setup
python -X utf8 -m pip install -r requirements.txt
```

### Step 3: Set up environment variables
```bash
# Create .env file in the project root (not in this folder)
cd /path/to/your/other/project
echo "GEMINI_API_KEY=AIzaSyDppglgSnlgiq8YSNTuKhqL-oxUZVlG8nU" > .env
```

### Step 4: Test it
```bash
# Test transcript extraction
python -X utf8 youtube-analytics-api-setup/scripts/youtube_transcript_extractor.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Test full metadata extraction
python -X utf8 youtube-analytics-api-setup/scripts/youtube_api_extractor.py
```

---

## For YouTube Analytics API (Advanced)

If you need channel analytics (not just public data), you'll need OAuth:

### Step 1: Get OAuth Credentials

1. Go to: https://console.cloud.google.com/
2. Select project: `sample-firebase-ai-app-74f63`
3. Enable: **YouTube Analytics API**
4. Create: **OAuth 2.0 Client ID** (Desktop app)
5. Download: `client_secret.json`
6. Place in: `youtube-analytics-api-setup/credentials/client_secret.json`

### Step 2: Run Analytics Script
```bash
python -X utf8 youtube-analytics-api-setup/scripts/youtube_analytics_example.py
```

Browser will open for authentication on first run.

---

## Service Account (Already Included)

**File**: `credentials/sample-firebase-ai-app-74f63-1bc5eda7a9ea.json`

**Project ID**: `sample-firebase-ai-app-74f63`

**Email**: `demo-service-account-oleg@sample-firebase-ai-app-74f63.iam.gserviceaccount.com`

**Note**: Service accounts don't work for YouTube Analytics on personal channels. Use OAuth instead.

---

## What's Working Now

### 1. YouTube Transcript Extraction
```bash
python -X utf8 scripts/youtube_transcript_extractor.py "YOUTUBE_URL"
```

**Gets**: Video transcript/captions

### 2. YouTube Metadata + Transcript
```bash
python -X utf8 scripts/youtube_api_extractor.py
```

**Gets**:
- Video title, description
- View count, like count, comment count
- Channel info
- Video duration
- Tags, category
- Full transcript

### 3. YouTube Analytics (Needs OAuth Setup)
```bash
python -X utf8 scripts/youtube_analytics_example.py
```

**Gets**:
- Views, watch time
- Traffic sources
- Demographics
- Device types
- Revenue (if monetized)
- Subscriber changes

---

## Summary

**Ready to use NOW**:
- API Key: `AIzaSyDppglgSnlgiq8YSNTuKhqL-oxUZVlG8nU`
- Scripts: `youtube_transcript_extractor.py`, `youtube_api_extractor.py`
- Service Account: `credentials/sample-firebase-ai-app-74f63-1bc5eda7a9ea.json`

**Needs OAuth setup**:
- YouTube Analytics API access
- Channel-specific analytics metrics

**Copy-paste ready**: Everything in this folder can be moved to other projects!
