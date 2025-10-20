# YouTube Analytics Metrics - Complete Reference (2025)

## Table of Contents
- [Core Metrics](#core-metrics)
- [Engagement Metrics](#engagement-metrics)
- [Watch Time Metrics](#watch-time-metrics)
- [Subscriber Metrics](#subscriber-metrics)
- [Revenue Metrics](#revenue-metrics)
- [Traffic Source Metrics](#traffic-source-metrics)
- [Demographics Metrics](#demographics-metrics)
- [Device & Platform Metrics](#device--platform-metrics)
- [Playlist Metrics](#playlist-metrics)
- [Card & End Screen Metrics](#card--end-screen-metrics)
- [Dimensions Reference](#dimensions-reference)
- [Metric Combinations](#metric-combinations)
- [New 2025 Metrics](#new-2025-metrics)

## Core Metrics

### Views & Impressions

| Metric | Description | Data Type | Availability |
|--------|-------------|-----------|--------------|
| `views` | Number of legitimate video views | Integer | All videos |
| `redViews` | Views by YouTube Premium members | Integer | All videos |
| `engagedViews` | Views with significant engagement (NEW 2025) | Integer | From Apr 30, 2025 |
| `impressions` | Times thumbnail was shown | Integer | Channel reports |
| `impressionsClickThroughRate` | % of impressions that became views | Float | Channel reports |

**Example Query:**
```python
metrics='views,redViews,impressions,impressionsClickThroughRate'
dimensions='day'
```

## Engagement Metrics

### User Interactions

| Metric | Description | Data Type | Notes |
|--------|-------------|-----------|-------|
| `likes` | Number of likes | Integer | All videos |
| `dislikes` | Number of dislikes | Integer | **Deprecated 2021** |
| `comments` | Number of comments | Integer | All videos |
| `shares` | Number of shares | Integer | All videos |
| `videosAddedToPlaylists` | Added to playlists count | Integer | All videos |
| `videosRemovedFromPlaylists` | Removed from playlists | Integer | All videos |

**Example Query:**
```python
metrics='likes,comments,shares,videosAddedToPlaylists'
dimensions='video'
sort='-likes'
```

### Engagement Rates

| Metric | Description | Data Type | Calculation |
|--------|-------------|-----------|-------------|
| `cardClickRate` | Card click-through rate | Float | cardClicks / cardImpressions |
| `cardTeaserClickRate` | Card teaser CTR | Float | cardTeaserClicks / cardTeaserImpressions |
| `subscribersGainedRate` | Subscriber gain rate | Float | subscribersGained / views |

## Watch Time Metrics

### Duration & Retention

| Metric | Description | Data Type | Unit |
|--------|-------------|-----------|------|
| `estimatedMinutesWatched` | Total watch time | Integer | Minutes |
| `estimatedRedMinutesWatched` | Premium watch time | Integer | Minutes |
| `averageViewDuration` | Avg time per view | Integer | Seconds |
| `averageViewPercentage` | % of video watched (avg) | Float | Percentage |
| `audienceWatchRatio` | Relative audience retention | Float | Ratio |
| `relativeRetentionPerformance` | Retention vs similar videos | Float | Ratio |

**Example Query:**
```python
metrics='estimatedMinutesWatched,averageViewDuration,averageViewPercentage'
dimensions='video'
filters='video==VIDEO_ID'
```

**Real-world Values:**
- High retention: `averageViewPercentage` > 50%
- Medium retention: 30-50%
- Low retention: < 30%

## Subscriber Metrics

### Subscriber Activity

| Metric | Description | Data Type | Notes |
|--------|-------------|-----------|-------|
| `subscribersGained` | New subscribers from video | Integer | Video/channel level |
| `subscribersLost` | Unsubscribes from video | Integer | Video/channel level |
| `subscribersNetChange` | Net subscriber change | Integer | Calculated: gained - lost |

**Example Query:**
```python
metrics='subscribersGained,subscribersLost'
dimensions='day'
startDate='2024-01-01'
endDate='2024-01-31'
```

**With Dimension:**
```python
metrics='views,subscribersGained'
dimensions='subscribedStatus'  # SUBSCRIBED vs UNSUBSCRIBED viewers
```

## Revenue Metrics

### Monetization (Requires Partner Program)

| Metric | Description | Data Type | Currency |
|--------|-------------|-----------|----------|
| `estimatedRevenue` | Total estimated earnings | Float | USD |
| `estimatedAdRevenue` | Ad revenue only | Float | USD |
| `estimatedRedPartnerRevenue` | YouTube Premium revenue | Float | USD |
| `grossRevenue` | Revenue before YouTube share | Float | USD |
| `cpm` | Cost per 1,000 impressions | Float | USD |
| `playbackBasedCpm` | CPM based on playbacks | Float | USD |

### Ad Performance

| Metric | Description | Data Type | Notes |
|--------|-------------|-----------|-------|
| `adImpressions` | Verified ad impressions | Integer | Monetized videos |
| `monetizedPlaybacks` | Playbacks with ads shown | Integer | Monetized videos |

**Example Query:**
```python
metrics='estimatedRevenue,estimatedAdRevenue,cpm,monetizedPlaybacks'
dimensions='day'
# Revenue metrics limited to 180 days lookback
startDate='2024-06-01'
endDate='2024-12-01'
```

**Important Notes:**
- Revenue metrics require **YouTube Partner Program** membership
- Data available with 2-3 day delay
- Limited to **180-day** historical lookback
- Requires scope: `yt-analytics-monetary.readonly`

## Traffic Source Metrics

### Source Types

Use with `dimensions='insightTrafficSourceType'`

| Source Type | Description | Views Metric |
|------------|-------------|--------------|
| `YT_SEARCH` | YouTube search results | High intent |
| `SUGGESTED_VIDEO` | Related/suggested videos | Discovery |
| `EXTERNAL_URL` | External websites | Referral |
| `NOTIFICATION` | Subscriber notifications | Engaged audience |
| `PLAYLIST` | From playlists | Binge watching |
| `BROWSE_FEATURES` | Home/trending | Discovery |
| `SUBSCRIBER` | Subscriber feed | Loyal audience |
| `HASHTAGS` | Hashtag pages | Discovery |
| `SHORTS` | YouTube Shorts feed | Short-form |
| `YT_CHANNEL` | Channel pages | Channel viewers |
| `ADVERTISING` | YouTube ads | Paid traffic |
| `END_SCREEN` | End screens | Cross-promotion |
| `CAMPAIGN_CARD` | Campaign cards | Promotion |

**Example Query:**
```python
metrics='views,estimatedMinutesWatched,averageViewDuration'
dimensions='insightTrafficSourceType'
sort='-views'
maxResults=10
```

**Detailed Sources:**
```python
dimensions='insightTrafficSourceType,insightTrafficSourceDetail'
# Provides specific source (e.g., which external URL)
```

## Demographics Metrics

### Age & Gender

Use `viewerPercentage` metric with demographics dimensions:

**Age Groups:**
- `age13-17`
- `age18-24`
- `age25-34`
- `age35-44`
- `age45-54`
- `age55-64`
- `age65-`

**Gender:**
- `male`
- `female`
- `user_specified`

**Example Query:**
```python
metrics='viewerPercentage'
dimensions='ageGroup,gender'
sort='gender,ageGroup'
```

### Geography

| Dimension | Description | Values |
|-----------|-------------|--------|
| `country` | Country code | US, GB, IN, CA, etc. |
| `province` | State/province | US-CA, US-NY, GB-ENG |
| `continent` | Continent code | 002 (Africa), 019 (Americas), 142 (Asia), 150 (Europe), 009 (Oceania) |
| `subContinent` | Sub-continent | Regional codes |

**Example Query:**
```python
metrics='views,estimatedMinutesWatched'
dimensions='country'
filters='country==US,GB,CA'  # Filter specific countries
sort='-views'
maxResults=25
```

## Device & Platform Metrics

### Device Types

Use with `dimensions='deviceType'`

| Device Type | Description |
|------------|-------------|
| `DESKTOP` | Desktop/laptop computers |
| `MOBILE` | Mobile phones |
| `TABLET` | Tablets |
| `TV` | Smart TVs, game consoles |
| `GAME_CONSOLE` | Gaming consoles |
| `UNKNOWN_PLATFORM` | Unidentified devices |

**Example Query:**
```python
metrics='views,estimatedMinutesWatched,averageViewDuration'
dimensions='deviceType'
sort='-views'
```

### Operating Systems

Use with `dimensions='operatingSystem'`

| OS | Examples |
|----|----------|
| `ANDROID` | Android devices |
| `IOS` | iPhone, iPad |
| `WINDOWS` | Windows PCs |
| `MACINTOSH` | macOS devices |
| `LINUX` | Linux systems |
| `PLAYSTATION` | PlayStation |
| `XBOX` | Xbox |
| `CHROMECAST` | Chromecast |

**Example Query:**
```python
metrics='views'
dimensions='operatingSystem'
filters='deviceType==MOBILE'  # Mobile OS breakdown
```

### Playback Location

Use with `dimensions='playbackLocation'`

| Location | Description |
|----------|-------------|
| `WATCH` | YouTube watch page |
| `CHANNEL` | Channel page |
| `EMBEDDED` | Embedded player (external sites) |
| `EXTERNAL_APP` | External apps |
| `MOBILE` | Mobile app |
| `SEARCH` | Search results page |

**Example Query:**
```python
metrics='views,estimatedMinutesWatched'
dimensions='playbackLocation'
```

## Playlist Metrics

### Playlist Performance

| Metric | Description | Data Type |
|--------|-------------|-----------|
| `playlistStarts` | Times playlist started | Integer |
| `playlistSaves` | Added to user playlists | Integer |
| `viewsPerPlaylistStart` | Avg views per start | Float |
| `averageTimeInPlaylist` | Avg time in playlist | Integer (seconds) |

**Example Query:**
```python
metrics='playlistStarts,viewsPerPlaylistStart,averageTimeInPlaylist'
dimensions='playlist'
filters='playlist==PLAYLIST_ID'
```

## Card & End Screen Metrics

### Cards

| Metric | Description | Data Type |
|--------|-------------|-----------|
| `cardImpressions` | Times cards shown | Integer |
| `cardClicks` | Card clicks | Integer |
| `cardClickRate` | Click-through rate | Float |
| `cardTeaserImpressions` | Teaser impressions | Integer |
| `cardTeaserClicks` | Teaser clicks | Integer |
| `cardTeaserClickRate` | Teaser CTR | Float |

**Example Query:**
```python
metrics='cardImpressions,cardClicks,cardClickRate'
dimensions='video'
filters='video==VIDEO_ID'
```

### Annotations (Deprecated)

| Metric | Status | Notes |
|--------|--------|-------|
| `annotationImpressions` | Deprecated | No longer available |
| `annotationClicks` | Deprecated | Removed 2019 |
| `annotationClickThroughRate` | Deprecated | Replaced by cards |
| `annotationCloseRate` | Deprecated | - |

## Dimensions Reference

### Time Dimensions

| Dimension | Format | Example |
|-----------|--------|---------|
| `day` | YYYY-MM-DD | 2025-01-15 |
| `month` | YYYY-MM | 2025-01 |

### Content Dimensions

| Dimension | Description | Format |
|-----------|-------------|--------|
| `video` | Specific video | Video ID |
| `group` | Video group | Group ID |
| `playlist` | Playlist | Playlist ID |
| `channel` | Channel | Channel ID |
| `uploadedVideo` | User-uploaded videos | Video ID |
| `claimedVideo` | Content ID claimed | Video ID |

### Sharing Dimensions

Use with `dimensions='sharingService'`

| Service | Description |
|---------|-------------|
| `FACEBOOK` | Shared to Facebook |
| `TWITTER` | Shared to Twitter/X |
| `WHATSAPP` | Shared via WhatsApp |
| `EMAIL` | Shared via email |
| `REDDIT` | Shared to Reddit |
| `INSTAGRAM` | Shared to Instagram |

**Example Query:**
```python
metrics='shares'
dimensions='sharingService'
sort='-shares'
```

## Metric Combinations

### Valid Combinations by Use Case

#### Video Performance Overview
```python
metrics='views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration,subscribersGained'
dimensions='video'
sort='-views'
maxResults=50
```

#### Traffic Analysis
```python
metrics='views,estimatedMinutesWatched,averageViewDuration'
dimensions='insightTrafficSourceType'
sort='-views'
```

#### Audience Demographics
```python
metrics='viewerPercentage'
dimensions='ageGroup,gender'
sort='gender,ageGroup'
```

#### Device Breakdown
```python
metrics='views,estimatedMinutesWatched'
dimensions='deviceType,operatingSystem'
sort='-views'
```

#### Geographic Performance
```python
metrics='views,estimatedMinutesWatched,subscribersGained'
dimensions='country'
sort='-views'
maxResults=25
```

#### Revenue Analysis (Monetized)
```python
metrics='estimatedRevenue,estimatedAdRevenue,cpm,monetizedPlaybacks'
dimensions='day'
startDate='2024-10-01'
endDate='2024-12-31'
```

#### Subscriber Activity
```python
metrics='views,estimatedMinutesWatched,subscribersGained,subscribersLost'
dimensions='subscribedStatus'
```

### Dimension Limits

- **Maximum 2 dimensions** per query (most combinations)
- Some dimension combinations are **not allowed**
- Check API documentation for valid combinations

**Invalid Example:**
```python
# NOT ALLOWED - too many dimensions
dimensions='day,video,country'  # ERROR: max 2 dimensions
```

## New 2025 Metrics

### engagedViews (Effective April 30, 2025)

**Description**: Views with significant user engagement

**Availability**: All reports from April 30, 2025

**Use Case**: Better understanding of actual engaged viewership vs passive views

**Example Query:**
```python
metrics='views,engagedViews'
dimensions='video'
startDate='2025-05-01'  # After launch date
endDate='2025-05-31'
```

**Interpretation:**
- High `engagedViews / views` ratio = Strong engagement
- Low ratio = Passive/background viewing

### Updated View Counting (2025)

Starting April 2025, view counting methodology was updated:

- `views` - New methodology (stricter)
- `engagedViews` - Previous methodology (legacy counting)

Both metrics available to track changes.

## API Query Limits

### Date Ranges
- **General metrics**: Up to 365 days
- **Revenue metrics**: Up to 180 days
- **Real-time data**: 24-48 hour delay typical

### Result Limits
- **maxResults**: 1-200 (default: 10)
- **Pagination**: Use `startIndex` for pagination

### Quota Costs
- Each query: **1-10 units** (depending on complexity)
- Default daily quota: **10,000 units**
- Can request increase to millions of units

### Rate Limits
- **1 request per second** per user (recommended)
- Implement exponential backoff for 429 errors

## Response Format

All metrics return JSON:

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    {"name": "video", "dataType": "STRING", "columnType": "DIMENSION"},
    {"name": "views", "dataType": "INTEGER", "columnType": "METRIC"},
    {"name": "likes", "dataType": "INTEGER", "columnType": "METRIC"}
  ],
  "rows": [
    ["VIDEO_ID_1", 15234, 542],
    ["VIDEO_ID_2", 8432, 321]
  ]
}
```

## Best Practices

### 1. Metric Selection
- Request only **needed metrics** (max 10 per request)
- Use **appropriate dimensions** for segmentation
- Consider **API quota** when designing queries

### 2. Performance Optimization
- **Batch requests** when possible
- **Cache results** to minimize API calls
- **Use filters** to reduce data volume

### 3. Data Freshness
- Analytics data has **2-3 day delay**
- **Real-time metrics not available**
- Plan sync schedules accordingly

### 4. Combining APIs
- **YouTube Data API** for metadata (title, thumbnail, tags)
- **YouTube Analytics API** for performance metrics
- **Store both** in Airtable for complete picture

## Quick Reference: Most Common Metrics

### Essential Metrics (All Videos)
```
views
likes
comments
shares
estimatedMinutesWatched
averageViewDuration
subscribersGained
```

### Advanced Metrics (Deep Analysis)
```
impressions
impressionsClickThroughRate
averageViewPercentage
cardClickRate
engagedViews
```

### Monetization Metrics (Partner Program)
```
estimatedRevenue
estimatedAdRevenue
cpm
monetizedPlaybacks
```

## Useful Links

- [Official Metrics Documentation](https://developers.google.com/youtube/analytics/metrics)
- [Dimensions Documentation](https://developers.google.com/youtube/analytics/dimensions)
- [Sample Queries](https://developers.google.com/youtube/analytics/sample-requests)
- [API Reference](https://developers.google.com/youtube/analytics/reference)
- [Revision History](https://developers.google.com/youtube/analytics/revision_history)

---

**Last Updated**: January 2025
**API Version**: v2
**Includes**: 2025 metric updates (engagedViews)
