# YouTube Analytics API Setup Guide

This folder contains everything needed to access YouTube API data, including analytics metrics.

## Table of Contents
1. [Overview](#overview)
2. [What's Included](#whats-included)
3. [API Types Explained](#api-types-explained)
4. [Quick Start](#quick-start)
5. [Authentication Methods](#authentication-methods)
6. [Available Metrics](#available-metrics)
7. [Usage Examples](#usage-examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

YouTube provides two main APIs for accessing data:

1. **YouTube Data API v3** - Public video metadata (views, likes, comments, titles, descriptions)
2. **YouTube Analytics API** - Channel owner analytics (detailed performance metrics, demographics, traffic sources)

**Key Difference**: YouTube Analytics API requires **OAuth 2.0** authentication and only works for channels you own. YouTube Data API can work with just an API key for public data.

---

## What's Included

```
youtube-analytics-api-setup/
├── scripts/
│   ├── youtube_transcript_extractor.py    # Simple transcript extraction
│   ├── youtube_api_extractor.py           # Full metadata + transcripts
│   └── youtube_analytics_example.py       # Analytics API example (NEW)
├── credentials/
│   ├── sample-firebase-ai-app-74f63-1bc5eda7a9ea.json  # Service account
│   └── .env.example                       # Environment variables template
├── requirements.txt                        # Python dependencies
└── README.md                              # This file
```

---

## API Types Explained

### YouTube Data API v3 (Currently Working)
- **What it does**: Access public video information
- **Authentication**: API Key (simple)
- **Available Data**:
  - Video metadata (title, description, tags)
  - View counts, like counts, comment counts
  - Channel information
  - Video transcripts/captions
  - Video duration, upload date
- **Limitations**: 10,000 quota units/day (default)
- **Cost**: Free (with quota limits)

### YouTube Analytics API (What You Asked About)
- **What it does**: Access detailed analytics for YOUR channels
- **Authentication**: OAuth 2.0 (requires user consent)
- **Available Data**:
  - Revenue metrics (if monetized)
  - Watch time, average view duration
  - Traffic sources (where viewers came from)
  - Demographics (age, gender, geography)
  - Device types, playback locations
  - Real-time analytics
  - Engagement metrics over time
- **Limitations**: Only for channels you own/manage
- **Cost**: Free (with quota limits)

---

## Quick Start

### 1. Install Dependencies

```bash
# From the youtube-analytics-api-setup folder
python -X utf8 -m pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Copy the `.env.example` to `.env` in the parent directory:

```bash
# Your existing API key (already in your .env)
GEMINI_API_KEY=AIzaSyDppglgSnlgiq8YSNTuKhqL-oxUZVlG8nU
```

### 3. Test YouTube Data API (Public Data)

```bash
# Extract transcript from any YouTube video
python -X utf8 scripts/youtube_transcript_extractor.py "https://www.youtube.com/watch?v=VIDEO_ID"

# Extract full metadata + transcript
python -X utf8 scripts/youtube_api_extractor.py
```

### 4. Set Up YouTube Analytics API (For Your Channels)

See [Authentication Methods](#authentication-methods) section below.

---

## Authentication Methods

### Method 1: API Key (Current Setup - Data API Only)

**What it accesses**: YouTube Data API v3 (public data only)

**Current Status**: ALREADY WORKING

Your API key: `AIzaSyDppglgSnlgiq8YSNTuKhqL-oxUZVlG8nU`

**No additional setup needed** for public video data.

---

### Method 2: OAuth 2.0 (Required for Analytics API)

**What it accesses**: YouTube Analytics API (your channel's analytics)

**Setup Steps**:

#### Step 1: Enable YouTube Analytics API in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `sample-firebase-ai-app-74f63` (or create new project)
3. Navigate to: **APIs & Services > Library**
4. Search for: **YouTube Analytics API**
5. Click **ENABLE**
6. Search for: **YouTube Data API v3** (should already be enabled)

#### Step 2: Create OAuth 2.0 Credentials

1. Go to: **APIs & Services > Credentials**
2. Click: **+ CREATE CREDENTIALS > OAuth client ID**
3. Choose: **Desktop app** (for local scripts) or **Web application** (for web apps)
4. Name it: "YouTube Analytics Access"
5. Click **CREATE**
6. Download the JSON file (save as `client_secret.json`)
7. Place it in: `youtube-analytics-api-setup/credentials/client_secret.json`

#### Step 3: First-Time OAuth Flow

When you run an Analytics API script for the first time:

1. Script will open your browser
2. Sign in with your YouTube channel's Google account
3. Grant permissions to access Analytics data
4. Script will save a token file (`token.json`) for future use
5. You won't need to authenticate again until token expires

---

### Method 3: Service Account (Advanced - Limited Use)

**Status**: You have this file: `credentials/sample-firebase-ai-app-74f63-1bc5eda7a9ea.json`

**Limitation**: Service accounts **cannot** access YouTube Analytics API for personal channels. They only work for Brand Accounts where you've explicitly granted service account access.

**When to use**: Enterprise YouTube channel management, automated systems

---

## Available Metrics

### YouTube Data API v3 Metrics (API Key)

From `youtube_api_extractor.py`, you can get:

```python
{
    'video_id': 'VIDEO_ID',
    'url': 'https://www.youtube.com/watch?v=VIDEO_ID',
    'title': 'Video Title',
    'description': 'Video Description...',
    'published_at': '2024-01-01T00:00:00Z',
    'channel_title': 'Channel Name',
    'channel_id': 'CHANNEL_ID',
    'duration': 'PT10M30S',
    'view_count': 1234567,
    'like_count': 12345,
    'comment_count': 234,
    'tags': ['tag1', 'tag2'],
    'category_id': '22',
    'default_language': 'en',
    'transcript': 'Full video transcript...'
}
```

### YouTube Analytics API Metrics (OAuth Required)

Available metrics you can request:

**Engagement Metrics**:
- `views` - Total views
- `estimatedMinutesWatched` - Watch time in minutes
- `averageViewDuration` - Average view duration in seconds
- `averageViewPercentage` - Percentage of video watched
- `likes`, `dislikes`, `shares`, `comments` - Engagement actions
- `subscribersGained`, `subscribersLost` - Subscriber changes

**Revenue Metrics** (if monetized):
- `estimatedRevenue` - Estimated earnings
- `estimatedAdRevenue` - Ad revenue
- `grossRevenue` - Total revenue
- `cpm` - Cost per mille (per 1000 impressions)

**Traffic Source Metrics**:
- `views` by `insightTrafficSourceType` - Where viewers came from
  - `YT_SEARCH` - YouTube search
  - `SUGGESTED_VIDEO` - Suggested videos
  - `EXT_URL` - External websites
  - `NOTIFICATION` - Notifications
  - `PLAYLIST` - Playlists

**Demographics**:
- `viewerPercentage` by `ageGroup` and `gender`
- `views` by `country`, `province`

**Device & Playback**:
- `views` by `deviceType` (MOBILE, DESKTOP, TV, TABLET)
- `views` by `operatingSystem` (Android, iOS, Windows, etc.)
- `views` by `playbackLocation` (WATCH, EMBEDDED, CHANNEL, etc.)

---

## Usage Examples

### Example 1: Get Public Video Data (Current Setup)

```python
# scripts/youtube_api_extractor.py already does this!

from googleapiclient.discovery import build
import os

api_key = os.getenv('GEMINI_API_KEY')
youtube = build('youtube', 'v3', developerKey=api_key)

request = youtube.videos().list(
    part='snippet,statistics,contentDetails',
    id='VIDEO_ID'
)
response = request.execute()
print(response)
```

### Example 2: Get Channel Analytics (Requires OAuth)

See `scripts/youtube_analytics_example.py` for full implementation.

```python
# Get last 30 days of views for your channel

from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
import datetime

# OAuth flow
flow = InstalledAppFlow.from_client_secrets_file(
    'credentials/client_secret.json',
    scopes=['https://www.googleapis.com/auth/youtube.readonly']
)
credentials = flow.run_local_server(port=0)

# Build Analytics API service
youtube_analytics = build('youtubeAnalytics', 'v2', credentials=credentials)

# Get last 30 days
end_date = datetime.date.today()
start_date = end_date - datetime.timedelta(days=30)

# Query analytics
response = youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate=start_date.isoformat(),
    endDate=end_date.isoformat(),
    metrics='views,estimatedMinutesWatched,averageViewDuration,subscribersGained',
    dimensions='day',
    sort='day'
).execute()

print(response)
```

### Example 3: Get Traffic Sources

```python
response = youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views,estimatedMinutesWatched',
    dimensions='insightTrafficSourceType',
    sort='-views'
).execute()

# Returns views by traffic source (search, suggested, external, etc.)
```

---

## Troubleshooting

### Issue: "API key not valid" error

**Solution**:
1. Check your API key in `.env` file
2. Verify API key is enabled for YouTube Data API v3 in Google Cloud Console
3. Check if you've exceeded daily quota (10,000 units/day)

### Issue: "The request cannot be completed because you have exceeded your quota"

**Solution**:
1. Wait 24 hours for quota reset (resets at midnight Pacific Time)
2. Request quota increase in Google Cloud Console
3. Optimize requests to use fewer quota units

### Issue: OAuth "access_denied" error

**Solution**:
1. Make sure you're signing in with the Google account that owns the YouTube channel
2. Check that YouTube Analytics API is enabled in your Google Cloud project
3. Verify OAuth consent screen is properly configured

### Issue: "Insufficient permissions" for Analytics API

**Solution**:
1. Make sure you're using OAuth 2.0 (not just API key)
2. Include required scope: `https://www.googleapis.com/auth/youtube.readonly`
3. Sign in with account that owns/manages the channel

### Issue: Service account doesn't work

**Explanation**: Service accounts cannot access YouTube Analytics for personal channels. You must:
1. Use OAuth 2.0 for personal/creator channels
2. OR use Brand Account and grant service account access (enterprise only)

---

## Next Steps

1. **For Public Data**: Your current setup works! Use `youtube_api_extractor.py`

2. **For Analytics Data**:
   - Follow OAuth setup instructions above
   - Run `scripts/youtube_analytics_example.py`
   - Grant permissions when browser opens
   - Start querying analytics metrics

3. **Increase Quota** (if needed):
   - Go to Google Cloud Console > APIs & Services > Quotas
   - Request quota increase (can go up to millions of units/day)

---

## API Documentation Links

- [YouTube Data API v3 Reference](https://developers.google.com/youtube/v3/docs)
- [YouTube Analytics API Reference](https://developers.google.com/youtube/analytics/reference)
- [YouTube Analytics Metrics](https://developers.google.com/youtube/analytics/metrics)
- [OAuth 2.0 Setup Guide](https://developers.google.com/youtube/v3/guides/authentication)

---

## Questions?

This setup gives you access to:
- Public video data (WORKING NOW with API key)
- Channel analytics (NEEDS OAuth setup)
- All metrics listed above

Follow the OAuth steps to unlock Analytics API access for your channels.
