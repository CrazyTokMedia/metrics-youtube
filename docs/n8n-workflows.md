# n8n Workflow Guide - YouTube to Airtable Integration

## Table of Contents
- [Overview](#overview)
- [n8n Setup](#n8n-setup)
- [Credentials Configuration](#credentials-configuration)
- [Workflow Templates](#workflow-templates)
- [Step-by-Step Workflow Build](#step-by-step-workflow-build)
- [Scheduling & Automation](#scheduling--automation)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

n8n is a workflow automation tool that connects YouTube Analytics API with Airtable, enabling automated metric syncing without code.

### Why n8n?

- **Visual Workflow Builder**: Drag-and-drop interface
- **Built-in OAuth Support**: Easy YouTube API authentication
- **Airtable Integration**: Native Airtable nodes
- **Scheduling**: Automated cron-based execution
- **Error Handling**: Built-in retry and error workflows
- **Self-Hosted or Cloud**: Flexible deployment options

### Architecture

```
┌─────────────────┐
│   n8n Cron      │  (Trigger: Daily/Weekly)
│    Trigger      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Airtable      │  (Read video list)
│   Get Records   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Loop Over      │  (Process each video)
│  Video IDs      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTTP Request   │  (YouTube Analytics API)
│  YouTube API    │  (OAuth authenticated)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Transform      │  (Format data)
│     Data        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Airtable      │  (Update/create records)
│  Update Record  │
└─────────────────┘
```

## n8n Setup

### Option 1: n8n Cloud (Recommended for Beginners)

1. Go to [n8n.cloud](https://n8n.cloud)
2. Sign up for free trial
3. Choose plan:
   - **Starter**: $20/month - 2,500 executions
   - **Pro**: $50/month - 10,000 executions
   - **Enterprise**: Custom pricing

### Option 2: Self-Hosted (Docker)

```bash
# Using Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Access at http://localhost:5678
```

### Option 3: Self-Hosted (npm)

```bash
# Install globally
npm install -g n8n

# Run n8n
n8n

# Access at http://localhost:5678
```

### Option 4: Self-Hosted (npx - One-time)

```bash
npx n8n
```

## Credentials Configuration

### 1. YouTube OAuth2 API Credentials

#### In n8n:

1. Go to **Settings** → **Credentials** → **New**
2. Search for "Google OAuth2 API"
3. Fill in:
   - **Credential Name**: "YouTube Analytics OAuth"
   - **Client ID**: Your Google Cloud client ID
   - **Client Secret**: Your Google Cloud client secret
   - **Scope**: `https://www.googleapis.com/auth/yt-analytics.readonly`
   - **Auth URI**: `https://accounts.google.com/o/oauth2/v2/auth`
   - **Access Token URI**: `https://oauth2.googleapis.com/token`
4. Click **Connect my account**
5. Authorize with Google account that owns YouTube channel

#### Required Scopes:
```
https://www.googleapis.com/auth/youtube.readonly
https://www.googleapis.com/auth/yt-analytics.readonly
https://www.googleapis.com/auth/yt-analytics-monetary.readonly
```

### 2. Airtable Credentials

#### In n8n:

1. Go to **Settings** → **Credentials** → **New**
2. Search for "Airtable API"
3. Fill in:
   - **Credential Name**: "Airtable YouTube Metrics"
   - **API Key**: Your Airtable Personal Access Token (starts with `pat...`)
4. Click **Save**

## Workflow Templates

### Template 1: Basic Daily Metrics Sync

```json
{
  "name": "YouTube Daily Metrics Sync",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 2 * * *"
            }
          ]
        }
      },
      "name": "Daily at 2 AM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "application": "airtable",
        "operation": "list",
        "baseId": "YOUR_BASE_ID",
        "table": "Videos"
      },
      "name": "Get Video List",
      "type": "n8n-nodes-base.airtable",
      "credentials": {
        "airtableApi": "Airtable YouTube Metrics"
      },
      "position": [450, 300]
    },
    {
      "parameters": {
        "batchSize": 1,
        "options": {}
      },
      "name": "Loop Videos",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [650, 300]
    },
    {
      "parameters": {
        "url": "https://youtubeanalytics.googleapis.com/v2/reports",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "googleOAuth2Api",
        "qs": {
          "ids": "channel==MINE",
          "startDate": "={{ $now.minus({days: 30}).toFormat('yyyy-MM-dd') }}",
          "endDate": "={{ $now.toFormat('yyyy-MM-dd') }}",
          "metrics": "views,likes,comments,estimatedMinutesWatched,averageViewDuration",
          "dimensions": "video",
          "filters": "video=={{ $json.fields['Video ID'] }}"
        }
      },
      "name": "Get YouTube Metrics",
      "type": "n8n-nodes-base.httpRequest",
      "credentials": {
        "googleOAuth2Api": "YouTube Analytics OAuth"
      },
      "position": [850, 300]
    },
    {
      "parameters": {
        "jsCode": "const metrics = $input.first().json.rows[0] || [];\nreturn {\n  json: {\n    'Views': metrics[1] || 0,\n    'Likes': metrics[2] || 0,\n    'Comments': metrics[3] || 0,\n    'Watch Time (min)': metrics[4] || 0,\n    'Avg View Duration': metrics[5] || 0\n  }\n};"
      },
      "name": "Transform Metrics",
      "type": "n8n-nodes-base.code",
      "position": [1050, 300]
    },
    {
      "parameters": {
        "application": "airtable",
        "operation": "update",
        "baseId": "YOUR_BASE_ID",
        "table": "Videos",
        "id": "={{ $('Loop Videos').item.json.id }}"
      },
      "name": "Update Airtable",
      "type": "n8n-nodes-base.airtable",
      "credentials": {
        "airtableApi": "Airtable YouTube Metrics"
      },
      "position": [1250, 300]
    }
  ],
  "connections": {
    "Daily at 2 AM": {
      "main": [[{"node": "Get Video List", "type": "main", "index": 0}]]
    },
    "Get Video List": {
      "main": [[{"node": "Loop Videos", "type": "main", "index": 0}]]
    },
    "Loop Videos": {
      "main": [[{"node": "Get YouTube Metrics", "type": "main", "index": 0}]]
    },
    "Get YouTube Metrics": {
      "main": [[{"node": "Transform Metrics", "type": "main", "index": 0}]]
    },
    "Transform Metrics": {
      "main": [[{"node": "Update Airtable", "type": "main", "index": 0}]]
    },
    "Update Airtable": {
      "main": [[{"node": "Loop Videos", "type": "main", "index": 0}]]
    }
  }
}
```

### Template 2: Advanced Multi-Metric Workflow

This workflow fetches multiple metric types (views, traffic sources, demographics) and stores them in separate Airtable tables.

## Step-by-Step Workflow Build

### Step 1: Create New Workflow

1. Open n8n
2. Click **New workflow**
3. Name it: "YouTube to Airtable Sync"

### Step 2: Add Schedule Trigger

1. Click **Add first step**
2. Search "Schedule Trigger"
3. Configure:
   - **Trigger Interval**: Every day
   - **Trigger at Hour**: 2 AM
   - **Timezone**: Your timezone

### Step 3: Get Videos from Airtable

1. Add new node → Search "Airtable"
2. Configure:
   - **Credential**: Select your Airtable credential
   - **Operation**: List
   - **Base ID**: Your base ID (e.g., `appXXXXXX`)
   - **Table**: Videos
   - **Return All**: ON
   - **Download Attachments**: OFF

### Step 4: Loop Through Videos

1. Add node → "Split In Batches"
2. Configure:
   - **Batch Size**: 1 (process one video at a time)
   - **Reset**: OFF

### Step 5: Get YouTube Analytics

1. Add node → "HTTP Request"
2. Configure:
   - **Method**: GET
   - **URL**: `https://youtubeanalytics.googleapis.com/v2/reports`
   - **Authentication**: Predefined Credential Type
   - **Credential Type**: Google OAuth2 API
   - **Credential**: Select YouTube Analytics OAuth

3. Add Query Parameters:
   ```
   ids: channel==MINE
   startDate: {{ $now.minus({days: 30}).toFormat('yyyy-MM-dd') }}
   endDate: {{ $now.toFormat('yyyy-MM-dd') }}
   metrics: views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration
   dimensions: video
   filters: video=={{ $json.fields['Video ID'] }}
   ```

### Step 6: Transform Data

1. Add node → "Code"
2. Use JavaScript mode:

```javascript
// Get metrics from YouTube API response
const youtubeData = $input.first().json;
const rows = youtubeData.rows || [];
const metrics = rows[0] || [];

// Get Airtable record data
const airtableRecord = $('Loop Videos').item.json;

// Transform to Airtable format
return {
  json: {
    recordId: airtableRecord.id,
    fields: {
      'Views': metrics[1] || 0,
      'Likes': metrics[2] || 0,
      'Comments': metrics[3] || 0,
      'Shares': metrics[4] || 0,
      'Watch Time (min)': metrics[5] || 0,
      'Avg View Duration': metrics[6] || 0,
      'Last Synced': new Date().toISOString()
    }
  }
};
```

### Step 7: Update Airtable

1. Add node → "Airtable"
2. Configure:
   - **Credential**: Your Airtable credential
   - **Operation**: Update
   - **Base ID**: Your base ID
   - **Table**: Videos
   - **Record ID**: `{{ $json.recordId }}`
   - **Fields**: Map from previous node

### Step 8: Connect Back to Loop

1. Connect "Update Airtable" output back to "Split In Batches" input
2. This creates the loop for processing all videos

### Step 9: Test Workflow

1. Click **Execute Workflow**
2. Check execution log for errors
3. Verify data in Airtable

### Step 10: Activate Workflow

1. Toggle **Active** switch in top-right
2. Workflow will now run on schedule

## Scheduling & Automation

### Cron Expressions

| Schedule | Expression | Description |
|----------|------------|-------------|
| Daily 2 AM | `0 2 * * *` | Every day at 2 AM |
| Every 6 hours | `0 */6 * * *` | Four times per day |
| Monday 9 AM | `0 9 * * 1` | Every Monday at 9 AM |
| Weekly Sunday | `0 3 * * 0` | Every Sunday at 3 AM |
| Monthly 1st | `0 4 1 * *` | 1st of month at 4 AM |

### Multiple Schedules

Create separate workflows for different update frequencies:

1. **Hourly**: Top-performing videos
2. **Daily**: All active videos
3. **Weekly**: Archive/historical data
4. **Monthly**: Full channel analytics

## Error Handling

### Add Error Workflow

1. Create new workflow: "YouTube Sync Error Handler"
2. Add trigger: "Error Trigger"
3. Add notification node (email, Slack, etc.)

### Error Trigger Configuration

```javascript
// In Error Handler workflow
{
  "name": "Error Handler",
  "nodes": [
    {
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger"
    },
    {
      "name": "Send Slack Alert",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "channel": "#alerts",
        "text": "YouTube Sync Failed: {{ $json.error.message }}"
      }
    }
  ]
}
```

### Retry Logic

1. On HTTP Request node:
   - **Retry On Fail**: ON
   - **Max Tries**: 3
   - **Wait Between Tries**: 1000ms

2. Add "IF" node after HTTP request:
   ```javascript
   {{ $json.error ? false : true }}
   ```

## Advanced Features

### Batch Processing for Performance

```javascript
// Modified loop - process 10 videos at once
{
  "parameters": {
    "batchSize": 10,  // Changed from 1
    "options": {}
  },
  "name": "Loop Videos",
  "type": "n8n-nodes-base.splitInBatches"
}
```

```javascript
// Modified HTTP Request - multiple video filters
{
  "parameters": {
    "qs": {
      "filters": "video=={{ $json.items.map(i => i.json.fields['Video ID']).join(',') }}"
    }
  }
}
```

### Traffic Sources Workflow

Separate workflow for traffic source analysis:

```javascript
// HTTP Request for traffic sources
{
  "url": "https://youtubeanalytics.googleapis.com/v2/reports",
  "qs": {
    "ids": "channel==MINE",
    "startDate": "{{ $now.minus({days: 30}).toFormat('yyyy-MM-dd') }}",
    "endDate": "{{ $now.toFormat('yyyy-MM-dd') }}",
    "metrics": "views,estimatedMinutesWatched",
    "dimensions": "insightTrafficSourceType",
    "filters": "video=={{ $json.fields['Video ID'] }}",
    "sort": "-views"
  }
}
```

### Demographics Workflow

```javascript
// HTTP Request for demographics
{
  "url": "https://youtubeanalytics.googleapis.com/v2/reports",
  "qs": {
    "ids": "channel==MINE",
    "startDate": "{{ $now.minus({days: 30}).toFormat('yyyy-MM-dd') }}",
    "endDate": "{{ $now.toFormat('yyyy-MM-dd') }}",
    "metrics": "viewerPercentage",
    "dimensions": "ageGroup,gender",
    "filters": "video=={{ $json.fields['Video ID'] }}",
    "sort": "gender,ageGroup"
  }
}
```

## Best Practices

### 1. Workflow Organization

- **Separate workflows** for different metric types
- **Use descriptive names** for nodes
- **Add notes** to complex transformations
- **Color-code** nodes by function

### 2. Performance Optimization

- **Batch API requests** when possible (up to 200 videos)
- **Cache results** using Set/Get nodes
- **Use SplitInBatches** for large datasets
- **Limit parallel executions** to avoid rate limits

### 3. Data Management

- **Upsert logic**: Check if record exists before create/update
- **Date formatting**: Use consistent ISO 8601 format
- **Null handling**: Provide default values
- **Data validation**: Check for required fields

### 4. Security

- **Use environment variables** for sensitive data
- **Rotate credentials** regularly
- **Limit workflow access** to authorized users
- **Enable SSL/TLS** for self-hosted instances

### 5. Monitoring

- **Set up error notifications** (email, Slack)
- **Log execution history** for debugging
- **Track API quota usage**
- **Monitor workflow execution times**

## Useful Links

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Workflow Templates](https://n8n.io/workflows)
- [n8n Community Forum](https://community.n8n.io/)
- [YouTube Analytics API](https://developers.google.com/youtube/analytics)
- [Airtable API](https://airtable.com/developers/web/api/introduction)

## Troubleshooting

### Issue: OAuth Token Expired

**Solution**:
1. Go to Credentials
2. Reconnect YouTube OAuth credential
3. Authorize again

### Issue: Airtable Rate Limit

**Solution**:
1. Add "Wait" node between Airtable calls (200ms)
2. Reduce batch size
3. Upgrade Airtable plan

### Issue: YouTube API Quota Exceeded

**Solution**:
1. Reduce sync frequency
2. Process fewer videos
3. Request quota increase in Google Cloud Console

### Issue: Workflow Execution Timeout

**Solution**:
1. Split into smaller workflows
2. Increase timeout settings (n8n config)
3. Optimize data processing

---

**Last Updated**: January 2025
**n8n Version**: 1.0+
