# YouTube Analytics API Guide

## Table of Contents
- [Overview](#overview)
- [OAuth 2.0 Setup](#oauth-20-setup)
- [API Endpoints](#api-endpoints)
- [Available Metrics](#available-metrics)
- [Code Examples](#code-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

The YouTube Analytics API provides detailed metrics and reports for YouTube channels and videos. It requires OAuth 2.0 authentication and provides access to private analytics data for authorized channels.

### Key Information
- **Base URL**: `https://youtubeanalytics.googleapis.com/v2/reports`
- **Authentication**: OAuth 2.0 (required)
- **API Version**: v2
- **Quota**: 10,000 units per day (default)
- **Rate Limit**: 1 request per second per user

### Important Limitations
- ❌ Service accounts are NOT supported
- ❌ Cannot access data without user authorization
- ❌ 48-hour delay for initial setup (first-time users)
- ✅ Can only access channels you own or have been granted access to

## OAuth 2.0 Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name (e.g., "YouTube Metrics Sync")
4. Click "Create"

### Step 2: Enable YouTube Analytics API

1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "YouTube Analytics API"
3. Click on it and press "Enable"
4. Also enable "YouTube Data API v3" (for video metadata)

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure OAuth consent screen (if first time):
   - User Type: External (for most use cases)
   - App name: Your application name
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add YouTube Analytics scopes
4. Create OAuth Client ID:
   - Application type: "Web application" (for n8n) or "Desktop app" (for scripts)
   - Name: "YouTube Metrics Client"
   - Authorized redirect URIs (for web app):
     - `https://your-n8n-instance.com/rest/oauth2-credential/callback`
     - `http://localhost:5678/rest/oauth2-credential/callback` (for local testing)
5. Click "Create"
6. Download the JSON file or copy Client ID and Client Secret

### Step 4: Configure OAuth Scopes

Required scopes for YouTube Analytics:
```
https://www.googleapis.com/auth/youtube.readonly
https://www.googleapis.com/auth/yt-analytics.readonly
https://www.googleapis.com/auth/yt-analytics-monetary.readonly
```

### Step 5: OAuth 2.0 Flow

#### Authorization URL
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=https://www.googleapis.com/auth/yt-analytics.readonly&
  access_type=offline&
  prompt=consent
```

#### Token Exchange
```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code=AUTHORIZATION_CODE&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
redirect_uri=YOUR_REDIRECT_URI&
grant_type=authorization_code
```

#### Token Refresh
```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
refresh_token=YOUR_REFRESH_TOKEN&
grant_type=refresh_token
```

## API Endpoints

### Get Channel Analytics Report

```http
GET https://youtubeanalytics.googleapis.com/v2/reports?
  ids=channel==MINE&
  startDate=2025-01-01&
  endDate=2025-01-31&
  metrics=views,estimatedMinutesWatched,averageViewDuration&
  dimensions=day&
  sort=-day
```

### Get Video Analytics Report

```http
GET https://youtubeanalytics.googleapis.com/v2/reports?
  ids=channel==MINE&
  startDate=2025-01-01&
  endDate=2025-01-31&
  metrics=views,likes,comments,shares&
  dimensions=video&
  filters=video==VIDEO_ID&
  sort=-views
```

### Get Multiple Videos Metrics

```http
GET https://youtubeanalytics.googleapis.com/v2/reports?
  ids=channel==MINE&
  startDate=2025-01-01&
  endDate=2025-01-31&
  metrics=views,likes,comments,estimatedMinutesWatched&
  dimensions=video&
  filters=video==VIDEO_ID1,VIDEO_ID2,VIDEO_ID3&
  maxResults=200
```

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `ids` | Yes | Channel ID (use `channel==MINE` for authenticated user) |
| `startDate` | Yes | Start date in YYYY-MM-DD format |
| `endDate` | Yes | End date in YYYY-MM-DD format |
| `metrics` | Yes | Comma-separated list of metrics (max 10) |
| `dimensions` | No | Group results by dimension (e.g., day, video, country) |
| `filters` | No | Filter results (e.g., `video==VIDEO_ID`) |
| `sort` | No | Sort order (e.g., `-views` for descending) |
| `maxResults` | No | Maximum results to return (default 10, max 200) |

## Available Metrics

### Core Metrics (Most Common)

| Metric | Description | Example Value |
|--------|-------------|---------------|
| `views` | Total video views | 15234 |
| `likes` | Number of likes | 542 |
| `dislikes` | Number of dislikes (deprecated) | - |
| `comments` | Number of comments | 87 |
| `shares` | Number of shares | 45 |
| `estimatedMinutesWatched` | Total watch time in minutes | 12543 |
| `averageViewDuration` | Average seconds watched per view | 185 |
| `averageViewPercentage` | % of video watched on average | 45.2 |
| `subscribersGained` | New subscribers | 23 |
| `subscribersLost` | Lost subscribers | 5 |

### Engagement Metrics

| Metric | Description |
|--------|-------------|
| `annotationClickThroughRate` | Click rate on annotations |
| `annotationCloseRate` | Rate of annotation closes |
| `cardClickRate` | Click rate on cards |
| `cardTeaserClickRate` | Click rate on card teasers |
| `engagedViews` | Views with significant engagement (new 2025) |

### Demographics Metrics (with dimensions)

| Metric | Dimension | Description |
|--------|-----------|-------------|
| `viewerPercentage` | `ageGroup` | Age distribution |
| `viewerPercentage` | `gender` | Gender distribution |
| `views` | `country` | Geographic distribution |

### Revenue Metrics (Monetized Channels)

| Metric | Description |
|--------|-------------|
| `estimatedRevenue` | Estimated earnings |
| `estimatedAdRevenue` | Estimated ad revenue |
| `estimatedRedPartnerRevenue` | YouTube Premium revenue |
| `grossRevenue` | Total gross revenue |
| `cpm` | Cost per thousand impressions |

### Traffic Source Metrics

| Metric | Dimension | Description |
|--------|-----------|-------------|
| `views` | `insightTrafficSourceType` | Traffic source breakdown |
| `views` | `insightTrafficSourceDetail` | Detailed traffic sources |

### Playlist Metrics

| Metric | Description |
|--------|-------------|
| `playlistStarts` | Times playlist was started |
| `playlistSaves` | Times added to playlists |
| `viewsPerPlaylistStart` | Average views per start |
| `averageTimeInPlaylist` | Average time in playlist |

## Code Examples

### Python Example (Using Google API Client)

```python
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timedelta

# OAuth credentials
creds = Credentials(
    token='ACCESS_TOKEN',
    refresh_token='REFRESH_TOKEN',
    token_uri='https://oauth2.googleapis.com/token',
    client_id='YOUR_CLIENT_ID',
    client_secret='YOUR_CLIENT_SECRET'
)

# Build YouTube Analytics service
youtube_analytics = build('youtubeAnalytics', 'v2', credentials=creds)

# Get video metrics for last 30 days
end_date = datetime.now().strftime('%Y-%m-%d')
start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

response = youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate=start_date,
    endDate=end_date,
    metrics='views,likes,comments,estimatedMinutesWatched,averageViewDuration',
    dimensions='video',
    sort='-views',
    maxResults=50
).execute()

# Process results
for row in response.get('rows', []):
    video_id = row[0]
    views = row[1]
    likes = row[2]
    comments = row[3]
    watch_time = row[4]
    avg_duration = row[5]

    print(f"Video: {video_id}")
    print(f"Views: {views}, Likes: {likes}, Comments: {comments}")
    print(f"Watch Time: {watch_time} min, Avg Duration: {avg_duration} sec")
    print("---")
```

### Node.js Example (Using googleapis)

```javascript
const { google } = require('googleapis');

// OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'YOUR_REDIRECT_URI'
);

oauth2Client.setCredentials({
  access_token: 'ACCESS_TOKEN',
  refresh_token: 'REFRESH_TOKEN'
});

// YouTube Analytics API
const youtubeAnalytics = google.youtubeAnalytics({
  version: 'v2',
  auth: oauth2Client
});

// Get metrics
async function getVideoMetrics(videoIds) {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const response = await youtubeAnalytics.reports.query({
    ids: 'channel==MINE',
    startDate: startDate,
    endDate: endDate,
    metrics: 'views,likes,comments,shares,estimatedMinutesWatched',
    dimensions: 'video',
    filters: `video==${videoIds.join(',')}`,
    maxResults: 200
  });

  return response.data;
}

// Usage
getVideoMetrics(['VIDEO_ID_1', 'VIDEO_ID_2'])
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### cURL Example

```bash
# Get access token first, then:

curl "https://youtubeanalytics.googleapis.com/v2/reports?\
ids=channel==MINE&\
startDate=2025-01-01&\
endDate=2025-01-31&\
metrics=views,likes,comments&\
dimensions=video&\
sort=-views" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Error Handling

### Common Error Codes

| Code | Error | Solution |
|------|-------|----------|
| 401 | Unauthorized | Refresh access token |
| 403 | Forbidden | Check API is enabled and scopes are correct |
| 400 | Bad Request | Validate query parameters |
| 429 | Rate Limit Exceeded | Implement exponential backoff |
| 503 | Service Unavailable | Retry with exponential backoff |

### Error Response Example

```json
{
  "error": {
    "code": 403,
    "message": "The request cannot be completed because you have exceeded your quota.",
    "errors": [
      {
        "message": "The request cannot be completed because you have exceeded your quota.",
        "domain": "youtube.quota",
        "reason": "quotaExceeded"
      }
    ]
  }
}
```

### Retry Logic Example

```python
import time
from googleapiclient.errors import HttpError

def get_analytics_with_retry(youtube_analytics, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = youtube_analytics.reports().query(
                ids='channel==MINE',
                startDate='2025-01-01',
                endDate='2025-01-31',
                metrics='views,likes',
                dimensions='video'
            ).execute()
            return response
        except HttpError as e:
            if e.resp.status in [429, 503]:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Rate limited. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise
    raise Exception("Max retries exceeded")
```

## Best Practices

### 1. Token Management
- Store refresh tokens securely (environment variables, secret managers)
- Implement automatic token refresh before expiration
- Handle token refresh failures gracefully

### 2. API Quota Management
- Each query costs 1 quota unit
- Monitor daily quota usage
- Request quota increase if needed (via Google Cloud Console)
- Batch video IDs in single request (up to 200 videos)

### 3. Data Freshness
- Analytics data has ~2-3 day delay
- Real-time metrics not available
- Check data availability before querying

### 4. Performance Optimization
- Request only needed metrics (max 10 per request)
- Use filters to reduce data volume
- Implement pagination for large datasets
- Cache results when appropriate

### 5. Date Ranges
- Maximum date range: 90 days for detailed reports
- Use `startDate` and `endDate` in YYYY-MM-DD format
- Historical data available from channel creation date

## Useful Links

- [YouTube Analytics API Official Docs](https://developers.google.com/youtube/analytics)
- [Metrics Reference](https://developers.google.com/youtube/analytics/metrics)
- [Dimensions Reference](https://developers.google.com/youtube/analytics/dimensions)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [API Explorer](https://developers.google.com/youtube/analytics/query_api)
- [Quota Management](https://console.cloud.google.com/apis/api/youtubeanalytics.googleapis.com/quotas)

## Troubleshooting

### Issue: "NoLinkedYouTubeAccount" Error
**Solution**: This error occurs when using service accounts. Use OAuth 2.0 with user consent instead.

### Issue: 48-Hour Delay for Data
**Solution**: First-time setup requires 48 hours. Wait and retry after this period.

### Issue: Insufficient Permissions
**Solution**: Ensure OAuth scopes include `yt-analytics.readonly` and user has granted consent.

### Issue: Empty Response
**Solution**:
- Check date range (data may not be available yet)
- Verify channel has videos in the specified period
- Ensure filters are correct

---

**Last Updated**: January 2025
**API Version**: v2
