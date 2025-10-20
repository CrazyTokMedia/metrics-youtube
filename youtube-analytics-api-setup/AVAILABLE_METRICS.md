# YouTube Analytics API - Complete Metrics Reference

This document lists all available metrics you can retrieve from YouTube Analytics API.

## Core Metrics Categories

### 1. Views & Watch Time

| Metric | Description | Type |
|--------|-------------|------|
| `views` | Number of times a video was viewed | Integer |
| `redViews` | Number of times a video was viewed by YouTube Premium members | Integer |
| `estimatedMinutesWatched` | Estimated minutes of video watched | Integer |
| `estimatedRedMinutesWatched` | Estimated minutes watched by Premium members | Integer |
| `averageViewDuration` | Average duration (seconds) a user watched a video | Integer |
| `averageViewPercentage` | Percentage of a video watched (average) | Float |

### 2. Engagement Metrics

| Metric | Description | Type |
|--------|-------------|------|
| `likes` | Number of times users liked videos | Integer |
| `dislikes` | Number of times users disliked videos (deprecated) | Integer |
| `shares` | Number of times users shared videos | Integer |
| `comments` | Number of times users commented on videos | Integer |
| `subscribersGained` | Number of subscribers gained | Integer |
| `subscribersLost` | Number of subscribers lost | Integer |
| `videosAddedToPlaylists` | Times videos were added to playlists | Integer |
| `videosRemovedFromPlaylists` | Times videos were removed from playlists | Integer |

### 3. Audience Retention

| Metric | Description | Type |
|--------|-------------|------|
| `audienceWatchRatio` | Average percentage of video watched | Float |
| `relativeRetentionPerformance` | Retention performance relative to similar videos | Float |

### 4. Revenue Metrics (Monetized Channels Only)

| Metric | Description | Type |
|--------|-------------|------|
| `estimatedRevenue` | Estimated total revenue (USD) | Float |
| `estimatedAdRevenue` | Estimated ad revenue (USD) | Float |
| `grossRevenue` | Total revenue before YouTube's share (USD) | Float |
| `estimatedRedPartnerRevenue` | Estimated Premium revenue (USD) | Float |
| `cpm` | Cost per thousand impressions (USD) | Float |
| `playbackBasedCpm` | CPM based on playbacks (USD) | Float |
| `adImpressions` | Number of ad impressions | Integer |
| `monetizedPlaybacks` | Number of playbacks where ads showed | Integer |

### 5. Ad Performance

| Metric | Description | Type |
|--------|-------------|------|
| `adImpressions` | Number of verified ad impressions | Integer |
| `cpm` | Ad revenue per 1,000 impressions | Float |
| `playbackBasedCpm` | Revenue per 1,000 playbacks where ads showed | Float |

### 6. Card & End Screen Metrics

| Metric | Description | Type |
|--------|-------------|------|
| `cardImpressions` | Times cards were displayed | Integer |
| `cardClicks` | Times cards were clicked | Integer |
| `cardClickRate` | Percentage of impressions that were clicked | Float |
| `cardTeaserImpressions` | Times card teasers were shown | Integer |
| `cardTeaserClicks` | Times card teasers were clicked | Integer |
| `cardTeaserClickRate` | Card teaser click-through rate | Float |

### 7. Annotations (Deprecated)

| Metric | Description | Type |
|--------|-------------|------|
| `annotationImpressions` | Times annotations were displayed | Integer |
| `annotationClicks` | Times annotations were clicked | Integer |
| `annotationClickThroughRate` | Annotation click-through rate | Float |
| `annotationCloseRate` | Rate at which viewers closed annotations | Float |

---

## Dimensions (Filter/Group By)

### Time Dimensions

| Dimension | Description | Values |
|-----------|-------------|--------|
| `day` | Day of year | YYYY-MM-DD |
| `month` | Month of year | YYYY-MM |

### Geography Dimensions

| Dimension | Description | Values |
|-----------|-------------|--------|
| `country` | Country code | US, GB, CA, etc. |
| `province` | Province/state code | US-CA, US-NY, etc. |
| `continent` | Continent code | 002 (Africa), 150 (Europe), etc. |
| `subContinent` | Sub-continent code | Regional codes |

### Content Dimensions

| Dimension | Description | Values |
|-----------|-------------|--------|
| `video` | Specific video | Video ID |
| `group` | Video group | Group ID |
| `playlist` | Playlist | Playlist ID |
| `channel` | Channel | Channel ID |

### Traffic Source Dimensions

| Dimension | Description | Values |
|-----------|-------------|--------|
| `insightTrafficSourceType` | Where traffic came from | See table below |
| `insightTrafficSourceDetail` | Detailed traffic source | Varies |

**Traffic Source Types**:
- `ADVERTISING` - YouTube ads
- `ANNOTATION` - Annotations (deprecated)
- `CAMPAIGN_CARD` - Campaign cards
- `END_SCREEN` - End screens
- `EXT_URL` - External websites
- `HASHTAGS` - Hashtag searches
- `NOTIFICATION` - Notifications
- `PLAYLIST` - Playlists
- `PROMOTED` - Promoted content
- `RELATED_VIDEO` - Suggested/related videos
- `SHORTS` - YouTube Shorts feed
- `SUBSCRIBER` - Subscriber feeds/notifications
- `YT_CHANNEL` - Channel pages
- `YT_OTHER_PAGE` - Other YouTube pages
- `YT_SEARCH` - YouTube search
- `YT_PLAYLIST_PAGE` - Playlist page

### Device & Platform Dimensions

| Dimension | Description | Values |
|-----------|-------------|--------|
| `deviceType` | Device category | DESKTOP, MOBILE, TABLET, TV, GAME_CONSOLE, UNKNOWN_PLATFORM |
| `operatingSystem` | Operating system | ANDROID, IOS, WINDOWS, MACINTOSH, LINUX, etc. |
| `screenType` | Screen type | WATCH, BROWSE, MOBILE, etc. |

### Demographics Dimensions

| Dimension | Description | Values |
|-----------|-------------|--------|
| `ageGroup` | Age range | age13-17, age18-24, age25-34, age35-44, age45-54, age55-64, age65- |
| `gender` | Viewer gender | male, female, user_specified |

### Playback Dimensions

| Dimension | Description | Values |
|-----------|-------------|--------|
| `subscribedStatus` | Subscriber status | SUBSCRIBED, UNSUBSCRIBED |
| `youtubeProduct` | YouTube product | CORE (regular), GAMING, KIDS, UNKNOWN |
| `playbackLocation` | Where video played | See table below |

**Playback Locations**:
- `WATCH` - YouTube watch page
- `CHANNEL` - Channel page
- `EMBEDDED` - Embedded player
- `EXTERNAL_APP` - External apps
- `MOBILE` - Mobile apps
- `SEARCH` - Search results
- `UNKNOWN` - Unknown location

### Content Ownership Dimensions

| Dimension | Description | Values |
|-----------|-------------|--------|
| `claimedStatus` | Content ID claim status | claimed, unclaimed |
| `uploaderType` | Who uploaded | self, thirdParty |

### Sharing Dimensions

| Dimension | Description | Values |
|-----------|-------------|--------|
| `sharingService` | Where video was shared | FACEBOOK, TWITTER, WHATSAPP, EMAIL, etc. |

---

## Example Query Patterns

### Pattern 1: Daily Views for Last 30 Days
```python
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views,estimatedMinutesWatched,averageViewDuration',
    dimensions='day',
    sort='day'
).execute()
```

### Pattern 2: Traffic Sources
```python
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views,estimatedMinutesWatched',
    dimensions='insightTrafficSourceType',
    sort='-views'
).execute()
```

### Pattern 3: Geography Breakdown
```python
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views,estimatedMinutesWatched,averageViewDuration',
    dimensions='country',
    sort='-views',
    maxResults=25
).execute()
```

### Pattern 4: Device Types
```python
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views,estimatedMinutesWatched',
    dimensions='deviceType',
    sort='-views'
).execute()
```

### Pattern 5: Demographics
```python
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='viewerPercentage',
    dimensions='ageGroup,gender',
    sort='gender,ageGroup'
).execute()
```

### Pattern 6: Top Videos
```python
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views,likes,comments,shares,estimatedMinutesWatched',
    dimensions='video',
    sort='-views',
    maxResults=10
).execute()
```

### Pattern 7: Subscriber Activity
```python
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views,subscribersGained,subscribersLost',
    dimensions='subscribedStatus',
    sort='-views'
).execute()
```

### Pattern 8: Revenue by Day (Monetized Only)
```python
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='estimatedRevenue,estimatedAdRevenue,cpm,monetizedPlaybacks',
    dimensions='day',
    sort='day'
).execute()
```

---

## Filters

You can add filters to narrow results:

```python
# Example: Views only from United States
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views',
    dimensions='day',
    filters='country==US',
    sort='day'
).execute()

# Example: Views from mobile devices only
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views',
    dimensions='day',
    filters='deviceType==MOBILE',
    sort='day'
).execute()

# Example: Specific video analytics
youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views,likes,comments',
    filters='video==VIDEO_ID_HERE',
    dimensions='day',
    sort='day'
).execute()
```

---

## Limits & Quotas

**Query Limits**:
- Max date range: 365 days for most metrics
- Revenue metrics: 180 days lookback
- Real-time data: 24-48 hour delay typical

**Dimension Limits**:
- Max 2 dimensions per query (for most combinations)
- Some dimensions cannot be combined

**API Quotas**:
- Default: 10,000 units/day
- Each query: ~1-10 units depending on complexity
- Can request increase to millions of units/day

---

## Response Format

All queries return JSON in this format:

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    {"name": "day", "dataType": "STRING", "columnType": "DIMENSION"},
    {"name": "views", "dataType": "INTEGER", "columnType": "METRIC"}
  ],
  "rows": [
    ["2024-01-01", 1234],
    ["2024-01-02", 2345],
    ["2024-01-03", 3456]
  ]
}
```

---

## Best Practices

1. **Start broad, then drill down**: Get overview metrics first, then use dimensions to segment
2. **Use filters wisely**: Narrow data to reduce processing and API calls
3. **Batch time periods**: Query larger date ranges, then aggregate/slice locally
4. **Cache results**: Store analytics data locally to avoid repeated API calls
5. **Monitor quotas**: Track API usage to stay within limits
6. **Combine APIs**: Use YouTube Data API for video metadata + Analytics API for performance data

---

## Documentation Links

- [YouTube Analytics API Reference](https://developers.google.com/youtube/analytics/reference)
- [Metrics Documentation](https://developers.google.com/youtube/analytics/metrics)
- [Dimensions Documentation](https://developers.google.com/youtube/analytics/dimensions)
- [Sample Queries](https://developers.google.com/youtube/analytics/sample-requests)
