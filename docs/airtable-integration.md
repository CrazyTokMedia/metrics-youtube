# Airtable Integration Guide

## Table of Contents
- [Overview](#overview)
- [Airtable Setup](#airtable-setup)
- [Table Schema Design](#table-schema-design)
- [API Authentication](#api-authentication)
- [API Operations](#api-operations)
- [Code Examples](#code-examples)
- [Rate Limits](#rate-limits)
- [Best Practices](#best-practices)

## Overview

This guide explains how to integrate YouTube metrics data with Airtable for storage, analysis, and reporting.

### Integration Flow

```
YouTube Analytics API → n8n Workflow → Airtable API → Airtable Base
```

### Key Components
- **Airtable Base**: Container for your tables
- **Tables**: Store video data and metrics
- **API Token**: Authentication for API access
- **Base ID & Table ID**: Identifiers for API calls

## Airtable Setup

### Step 1: Create Airtable Account

1. Go to [airtable.com](https://airtable.com)
2. Sign up for free account (or log in)
3. Free plan includes:
   - Unlimited bases
   - 1,200 records per base
   - 2GB attachments per base
   - 1,000 API calls per workspace per month

### Step 2: Create a Base

1. Click "Add a base" or "Create a base"
2. Choose "Start from scratch"
3. Name it: "YouTube Metrics"
4. Click "Create"

### Step 3: Get API Credentials

#### Get Personal Access Token (Recommended)
1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Click "Create new token"
3. Name: "YouTube Metrics Integration"
4. Add scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
5. Add access to your base: "YouTube Metrics"
6. Click "Create token"
7. Copy the token (starts with `pat...`)

#### Get Base ID
1. Open your base in browser
2. Look at URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. Base ID is the part starting with `app`
4. Example: `appAbC123dEf456GhI`

#### Get Table ID (Optional, can use table name)
1. In your base, click on the table
2. Look at URL: `https://airtable.com/appXXXXXX/tblYYYYYY/...`
3. Table ID starts with `tbl`
4. Example: `tblXyZ789aBc012DeF`

## Table Schema Design

### Recommended Table Structure

#### Table 1: Videos

| Field Name | Field Type | Description | Example |
|------------|------------|-------------|---------|
| Video ID | Single line text (Primary) | YouTube video ID | `dQw4w9WgXcQ` |
| Video URL | URL | Full YouTube URL | `https://youtube.com/watch?v=...` |
| Title | Single line text | Video title | "Best Video Ever" |
| Channel | Single line text | Channel name | "My Channel" |
| Published Date | Date | Upload date | 2024-01-15 |
| Duration | Number | Video duration in seconds | 185 |
| Thumbnail | Attachment | Video thumbnail | (image) |
| Tags | Multiple select | Video tags | Marketing, Tutorial |
| Category | Single select | Video category | Education |
| Status | Single select | Tracking status | Active, Archived |

#### Table 2: Video Metrics

| Field Name | Field Type | Description | Example |
|------------|------------|-------------|---------|
| Video | Link to Videos table | Reference to video | (linked record) |
| Date | Date | Metrics date | 2024-01-15 |
| Views | Number | Total views | 15234 |
| Likes | Number | Total likes | 542 |
| Comments | Number | Total comments | 87 |
| Shares | Number | Total shares | 45 |
| Watch Time (min) | Number | Minutes watched | 12543 |
| Avg View Duration | Number | Seconds per view | 185 |
| Avg View % | Number | % of video watched | 45.2 |
| Subscribers Gained | Number | New subscribers | 23 |
| Subscribers Lost | Number | Lost subscribers | 5 |
| Estimated Revenue | Currency | Revenue (USD) | $125.50 |
| CPM | Currency | Cost per 1K impressions | $4.50 |
| Last Updated | Last modified time | Auto-updated | (auto) |

#### Table 3: Traffic Sources (Optional)

| Field Name | Field Type | Description | Example |
|------------|------------|-------------|---------|
| Video | Link to Videos table | Reference to video | (linked record) |
| Date Range | Single line text | Date range | 2024-01-01 to 2024-01-31 |
| Source Type | Single select | Traffic source | YouTube Search |
| Views | Number | Views from source | 5432 |
| Watch Time | Number | Watch time from source | 3421 |
| Percentage | Number | % of total traffic | 35.6 |

#### Table 4: Demographics (Optional)

| Field Name | Field Type | Description | Example |
|------------|------------|-------------|---------|
| Video | Link to Videos table | Reference to video | (linked record) |
| Date Range | Single line text | Date range | 2024-01-01 to 2024-01-31 |
| Age Group | Single select | Age range | 18-24 |
| Gender | Single select | Gender | Female |
| Country | Single line text | Country code | US |
| Viewer Percentage | Number | % of viewers | 25.5 |

### Alternative: Single Table Design (Simpler)

For smaller projects, use one table with all fields:

| Field Name | Field Type | Notes |
|------------|------------|-------|
| Video ID | Single line text | Primary key |
| Video URL | URL | Full URL |
| Title | Single line text | - |
| Channel | Single line text | - |
| Published Date | Date | - |
| Last 7 Days Views | Number | Rolling metric |
| Last 7 Days Likes | Number | Rolling metric |
| Last 7 Days Comments | Number | Rolling metric |
| Last 7 Days Watch Time | Number | Rolling metric |
| Total Views | Number | All-time |
| Total Likes | Number | All-time |
| Last Synced | Last modified time | Auto |

## API Authentication

### Using Personal Access Token

```python
import requests

AIRTABLE_TOKEN = 'patXXXXXXXXXXXXXX'
BASE_ID = 'appXXXXXXXXXXXXXX'

headers = {
    'Authorization': f'Bearer {AIRTABLE_TOKEN}',
    'Content-Type': 'application/json'
}
```

### Environment Variables

```bash
# .env file
AIRTABLE_TOKEN=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Videos
```

```python
import os
from dotenv import load_dotenv

load_dotenv()

AIRTABLE_TOKEN = os.getenv('AIRTABLE_TOKEN')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')
TABLE_NAME = os.getenv('AIRTABLE_TABLE_NAME')
```

## API Operations

### Base URL Structure

```
https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}
```

### List Records (GET)

```python
import requests

url = f'https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}'
headers = {'Authorization': f'Bearer {AIRTABLE_TOKEN}'}

response = requests.get(url, headers=headers)
records = response.json().get('records', [])

for record in records:
    record_id = record['id']
    fields = record['fields']
    print(f"Video ID: {fields.get('Video ID')}")
    print(f"Title: {fields.get('Title')}")
```

### Filter Records

```python
# Get specific video by Video ID
params = {
    'filterByFormula': '{Video ID} = "dQw4w9WgXcQ"'
}

response = requests.get(url, headers=headers, params=params)
records = response.json().get('records', [])
```

### Create Record (POST)

```python
url = f'https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}'

data = {
    'fields': {
        'Video ID': 'dQw4w9WgXcQ',
        'Video URL': 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'Title': 'Never Gonna Give You Up',
        'Views': 1000000,
        'Likes': 50000
    }
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(f"Created record: {result['id']}")
```

### Update Record (PATCH)

```python
record_id = 'recXXXXXXXXXXXXXX'
url = f'https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}/{record_id}'

data = {
    'fields': {
        'Views': 1500000,
        'Likes': 75000,
        'Comments': 1234
    }
}

response = requests.patch(url, headers=headers, json=data)
result = response.json()
```

### Batch Update (Multiple Records)

```python
url = f'https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}'

# Update up to 10 records at once
data = {
    'records': [
        {
            'id': 'recXXXXXXXXXXXXXX',
            'fields': {'Views': 1000000}
        },
        {
            'id': 'recYYYYYYYYYYYYYY',
            'fields': {'Views': 2000000}
        }
    ]
}

response = requests.patch(url, headers=headers, json=data)
```

### Delete Record (DELETE)

```python
record_id = 'recXXXXXXXXXXXXXX'
url = f'https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}/{record_id}'

response = requests.delete(url, headers=headers)
```

## Code Examples

### Complete Integration Example

```python
import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configuration
AIRTABLE_TOKEN = os.getenv('AIRTABLE_TOKEN')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')
TABLE_NAME = 'Videos'

class AirtableClient:
    def __init__(self, token, base_id, table_name):
        self.token = token
        self.base_id = base_id
        self.table_name = table_name
        self.base_url = f'https://api.airtable.com/v0/{base_id}/{table_name}'
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_all_records(self):
        """Get all records from table"""
        records = []
        offset = None

        while True:
            params = {'offset': offset} if offset else {}
            response = requests.get(self.base_url, headers=self.headers, params=params)
            data = response.json()

            records.extend(data.get('records', []))
            offset = data.get('offset')

            if not offset:
                break

        return records

    def find_record_by_video_id(self, video_id):
        """Find record by Video ID field"""
        params = {
            'filterByFormula': f'{{Video ID}} = "{video_id}"'
        }
        response = requests.get(self.base_url, headers=self.headers, params=params)
        records = response.json().get('records', [])
        return records[0] if records else None

    def create_or_update_video(self, video_data):
        """Create new video or update if exists"""
        video_id = video_data.get('video_id')
        existing = self.find_record_by_video_id(video_id)

        fields = {
            'Video ID': video_id,
            'Video URL': f'https://youtube.com/watch?v={video_id}',
            'Title': video_data.get('title'),
            'Views': video_data.get('views'),
            'Likes': video_data.get('likes'),
            'Comments': video_data.get('comments')
        }

        if existing:
            # Update existing record
            record_id = existing['id']
            url = f'{self.base_url}/{record_id}'
            response = requests.patch(url, headers=self.headers, json={'fields': fields})
            print(f"Updated: {video_id}")
        else:
            # Create new record
            response = requests.post(self.base_url, headers=self.headers, json={'fields': fields})
            print(f"Created: {video_id}")

        return response.json()

    def batch_update_metrics(self, metrics_data):
        """Update multiple records in batch"""
        records = []

        for video_id, metrics in metrics_data.items():
            existing = self.find_record_by_video_id(video_id)
            if existing:
                records.append({
                    'id': existing['id'],
                    'fields': metrics
                })

        # Split into batches of 10
        for i in range(0, len(records), 10):
            batch = records[i:i+10]
            data = {'records': batch}
            response = requests.patch(self.base_url, headers=self.headers, json=data)
            print(f"Updated batch {i//10 + 1}")

# Usage
client = AirtableClient(AIRTABLE_TOKEN, BASE_ID, TABLE_NAME)

# Create or update single video
video_data = {
    'video_id': 'dQw4w9WgXcQ',
    'title': 'Never Gonna Give You Up',
    'views': 1000000,
    'likes': 50000,
    'comments': 1234
}
client.create_or_update_video(video_data)

# Batch update metrics
metrics_data = {
    'dQw4w9WgXcQ': {'Views': 1500000, 'Likes': 75000},
    'VIDEO_ID_2': {'Views': 500000, 'Likes': 25000}
}
client.batch_update_metrics(metrics_data)
```

### Sync YouTube Metrics to Airtable

```python
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# YouTube Analytics setup (from previous guide)
youtube_analytics = build('youtubeAnalytics', 'v2', credentials=creds)

# Airtable setup
airtable = AirtableClient(AIRTABLE_TOKEN, BASE_ID, 'Video Metrics')

# Get metrics from YouTube
response = youtube_analytics.reports().query(
    ids='channel==MINE',
    startDate='2024-01-01',
    endDate='2024-01-31',
    metrics='views,likes,comments,estimatedMinutesWatched',
    dimensions='video'
).execute()

# Sync to Airtable
for row in response.get('rows', []):
    video_id = row[0]
    metrics = {
        'Video ID': video_id,
        'Views': row[1],
        'Likes': row[2],
        'Comments': row[3],
        'Watch Time (min)': row[4],
        'Date': '2024-01-31'
    }
    airtable.create_or_update_video(metrics)
```

## Rate Limits

### Free Plan Limits
- **1,000 API requests per workspace per month**
- **5 requests per second per base**
- **10 records per create/update request**

### Plus Plan ($20/month)
- **100,000 requests per workspace per month**
- Same rate limits

### Pro Plan ($45/month)
- **500,000 requests per workspace per month**
- Same rate limits

### Handling Rate Limits

```python
import time
from requests.exceptions import HTTPError

def make_airtable_request(url, headers, method='GET', **kwargs):
    max_retries = 3
    retry_delay = 1

    for attempt in range(max_retries):
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, **kwargs)
            elif method == 'POST':
                response = requests.post(url, headers=headers, **kwargs)
            elif method == 'PATCH':
                response = requests.patch(url, headers=headers, **kwargs)

            response.raise_for_status()
            return response.json()

        except HTTPError as e:
            if e.response.status_code == 429:  # Rate limit
                wait_time = retry_delay * (2 ** attempt)
                print(f"Rate limited. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise

    raise Exception("Max retries exceeded")
```

## Best Practices

### 1. Data Validation
- Validate data before sending to Airtable
- Handle missing fields gracefully
- Use appropriate field types

### 2. Error Handling
- Implement retry logic for rate limits
- Log errors for debugging
- Handle network failures

### 3. Performance Optimization
- Use batch operations (up to 10 records)
- Cache record IDs to avoid redundant lookups
- Minimize API calls by combining operations

### 4. Security
- Store API tokens in environment variables
- Never commit tokens to version control
- Rotate tokens regularly
- Use least-privilege access scopes

### 5. Data Management
- Implement upsert logic (create or update)
- Use Video ID as unique identifier
- Archive old data periodically
- Monitor storage limits

## Useful Links

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [Authentication Guide](https://airtable.com/developers/web/api/authentication)
- [Rate Limits](https://airtable.com/developers/web/api/rate-limits)
- [Field Types Reference](https://airtable.com/developers/web/api/field-model)
- [Airtable Pricing](https://airtable.com/pricing)

## Troubleshooting

### Issue: "NOT_AUTHORIZED" Error
**Solution**: Check your Personal Access Token has correct scopes and base access.

### Issue: "INVALID_REQUEST_BODY" Error
**Solution**: Validate field names match exactly (case-sensitive). Check field types are correct.

### Issue: Rate Limit Exceeded
**Solution**: Implement exponential backoff. Consider upgrading plan or optimizing requests.

### Issue: Record Not Found
**Solution**: Use filterByFormula to search instead of assuming record exists. Implement create-or-update logic.

---

**Last Updated**: January 2025
