# Quick Start Guide - YouTube to Airtable Integration

## 🚀 Overview

This guide will get you up and running with automated YouTube metrics syncing to Airtable in **under 30 minutes**.

### What You'll Build

```
YouTube Channel → OAuth Authentication → YouTube Analytics API
                                              ↓
                                         n8n Workflow
                                              ↓
                                         Airtable Base
```

### Prerequisites

- ✅ Google account with YouTube channel
- ✅ Airtable account (free tier works)
- ✅ n8n instance (cloud or self-hosted)
- ✅ 30 minutes of time

---

## 📋 Step-by-Step Setup

### Step 1: Set Up Google Cloud Project (10 minutes)

#### 1.1 Create Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select Project** → **New Project**
3. Name: `YouTube Metrics Sync`
4. Click **Create**

#### 1.2 Enable APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - ✅ **YouTube Analytics API**
   - ✅ **YouTube Data API v3**

#### 1.3 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure consent screen (first time):
   - User Type: **External**
   - App name: `YouTube Metrics App`
   - Your email for support
   - Add scopes (next step)
   - Save and continue

4. Add OAuth scopes:
   ```
   https://www.googleapis.com/auth/youtube.readonly
   https://www.googleapis.com/auth/yt-analytics.readonly
   https://www.googleapis.com/auth/yt-analytics-monetary.readonly
   ```

5. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `n8n YouTube Integration`
   - Authorized redirect URIs:
     - `https://your-n8n-instance.com/rest/oauth2-credential/callback`
     - `http://localhost:5678/rest/oauth2-credential/callback` (for local testing)

6. Click **Create**
7. **Save Client ID and Client Secret** (you'll need these)

---

### Step 2: Set Up Airtable (5 minutes)

#### 2.1 Create Base

1. Go to [airtable.com](https://airtable.com)
2. Click **Create a base** → **Start from scratch**
3. Name: `YouTube Metrics`

#### 2.2 Create Table Structure

**Table Name: Videos**

Add these fields (click + to add column):

| Field Name | Field Type | Primary |
|------------|------------|---------|
| Video ID | Single line text | ✅ Yes |
| Video URL | URL | |
| Title | Single line text | |
| Channel | Single line text | |
| Views | Number | |
| Likes | Number | |
| Comments | Number | |
| Shares | Number | |
| Watch Time (min) | Number | |
| Avg View Duration | Number | |
| Subscribers Gained | Number | |
| Last Synced | Last modified time | |

#### 2.3 Get API Credentials

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Click **Create new token**
3. Name: `YouTube Metrics Integration`
4. Add scopes:
   - ✅ `data.records:read`
   - ✅ `data.records:write`
   - ✅ `schema.bases:read`
5. Add access to base: Select `YouTube Metrics`
6. Click **Create token**
7. **Copy token** (starts with `pat...`) - save it securely

#### 2.4 Get Base ID

1. Open your base in browser
2. Look at URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. **Copy Base ID** (starts with `app`)

#### 2.5 Add Sample Video

Add one video manually to test:
- Video ID: `dQw4w9WgXcQ`
- Video URL: `https://youtube.com/watch?v=dQw4w9WgXcQ`
- Title: `Test Video`

---

### Step 3: Set Up n8n (10 minutes)

#### 3.1 Access n8n

**Option A: n8n Cloud** (Recommended)
1. Go to [n8n.cloud](https://n8n.cloud)
2. Sign up for account
3. Access your instance

**Option B: Self-Hosted (Docker)**
```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```
Then open: http://localhost:5678

#### 3.2 Add YouTube Credentials

1. In n8n, go to **Settings** → **Credentials**
2. Click **Add credential**
3. Search: **Google OAuth2 API**
4. Fill in:
   - Name: `YouTube Analytics OAuth`
   - Client ID: [Your Google Cloud Client ID]
   - Client Secret: [Your Google Cloud Client Secret]
   - Scope: `https://www.googleapis.com/auth/yt-analytics.readonly`
   - Auth URI: `https://accounts.google.com/o/oauth2/v2/auth`
   - Access Token URI: `https://oauth2.googleapis.com/token`
5. Click **Connect my account**
6. Authorize with your YouTube channel's Google account
7. Save

#### 3.3 Add Airtable Credentials

1. Click **Add credential** again
2. Search: **Airtable API**
3. Fill in:
   - Name: `Airtable YouTube Metrics`
   - API Key: [Your Airtable token - starts with `pat...`]
4. Save

#### 3.4 Create Workflow

1. Click **New workflow**
2. Name: `YouTube to Airtable Sync`

**Add Nodes:**

**Node 1: Manual Trigger** (for testing)
- Add node → Search "Manual Trigger"
- This allows you to test manually

**Node 2: Airtable - Get Videos**
- Add node → Search "Airtable"
- Operation: **List**
- Credential: Select `Airtable YouTube Metrics`
- Base ID: [Your Base ID - starts with `app`]
- Table: `Videos`
- Return All: **ON**

**Node 3: Split In Batches**
- Add node → Search "Split In Batches"
- Batch Size: `1` (process one video at a time)

**Node 4: HTTP Request - YouTube API**
- Add node → Search "HTTP Request"
- Method: **GET**
- URL: `https://youtubeanalytics.googleapis.com/v2/reports`
- Authentication: **Predefined Credential Type**
- Credential Type: **Google OAuth2 API**
- Select: `YouTube Analytics OAuth`
- **Add Query Parameters** (click Add Parameter for each):
  - `ids` = `channel==MINE`
  - `startDate` = `{{ $now.minus({days: 30}).toFormat('yyyy-MM-dd') }}`
  - `endDate` = `{{ $now.toFormat('yyyy-MM-dd') }}`
  - `metrics` = `views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration,subscribersGained`
  - `dimensions` = `video`
  - `filters` = `video=={{ $json.fields['Video ID'] }}`

**Node 5: Code - Transform Data**
- Add node → Search "Code"
- Mode: **Run Once for All Items**
- Code:
```javascript
// Get YouTube API response
const youtubeData = $input.first().json;
const rows = youtubeData.rows || [];
const metrics = rows[0] || [];

// Get Airtable record
const airtableRecord = $('Split In Batches').item.json;

// Return formatted data
return [{
  json: {
    recordId: airtableRecord.id,
    fields: {
      'Views': metrics[1] || 0,
      'Likes': metrics[2] || 0,
      'Comments': metrics[3] || 0,
      'Shares': metrics[4] || 0,
      'Watch Time (min)': metrics[5] || 0,
      'Avg View Duration': metrics[6] || 0,
      'Subscribers Gained': metrics[7] || 0
    }
  }
}];
```

**Node 6: Airtable - Update Record**
- Add node → Search "Airtable"
- Operation: **Update**
- Credential: `Airtable YouTube Metrics`
- Base ID: [Your Base ID]
- Table: `Videos`
- Record ID: `{{ $json.recordId }}`
- **Fields to Send**: Select "Define Below"
- Map fields from previous node:
  - Views = `{{ $json.fields.Views }}`
  - Likes = `{{ $json.fields.Likes }}`
  - Comments = `{{ $json.fields.Comments }}`
  - etc.

**Connect Nodes:**
1. Manual Trigger → Airtable
2. Airtable → Split In Batches
3. Split In Batches → HTTP Request
4. HTTP Request → Code
5. Code → Airtable Update
6. Airtable Update → Split In Batches (loop back)

#### 3.5 Test Workflow

1. Click **Execute Workflow** (top right)
2. Check execution log
3. Verify data updated in Airtable
4. Check your test video has metrics!

---

### Step 4: Automate (5 minutes)

#### 4.1 Replace Manual Trigger with Schedule

1. Delete "Manual Trigger" node
2. Add new node → Search "Schedule Trigger"
3. Configure:
   - Trigger Interval: **Every day**
   - Trigger at Hour: **2** (2 AM)
   - Timezone: [Your timezone]
4. Connect to Airtable node

#### 4.2 Activate Workflow

1. Click **Active** toggle (top right)
2. Workflow now runs automatically every day at 2 AM!

---

## 🎯 Next Steps

### Add More Videos

1. Manually add more Video IDs to Airtable
2. Or build a separate workflow to discover videos from your channel
3. The sync workflow will automatically process all videos

### Expand Metrics

Add more metrics to your HTTP Request node:
```
metrics=views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration,subscribersGained,cardClickRate,impressions
```

Update Airtable table with new fields.

### Set Up Error Handling

1. Create new workflow: "Error Handler"
2. Add "Error Trigger" node
3. Add notification (Email/Slack)
4. Link to main workflow

### Monitor Performance

- Check n8n execution history
- Review Airtable data quality
- Monitor YouTube API quota usage

---

## 📚 Additional Resources

### Documentation
- [YouTube API Guide](./youtube-api-guide.md) - Complete API reference
- [Airtable Integration](./airtable-integration.md) - Advanced Airtable features
- [n8n Workflows](./n8n-workflows.md) - Advanced workflow patterns
- [Metrics Reference](./metrics-reference.md) - All available metrics

### Advanced Workflows

**Traffic Sources Analysis:**
- Separate workflow for traffic source metrics
- Store in different Airtable table
- Analyze where views come from

**Demographics Tracking:**
- Age and gender breakdown
- Geographic distribution
- Device type analysis

**Revenue Tracking (Monetized Channels):**
- Daily revenue metrics
- CPM analysis
- Ad performance tracking

---

## ⚠️ Troubleshooting

### Issue: OAuth "access_denied"
**Solution**: Ensure you're signing in with the Google account that owns the YouTube channel.

### Issue: Airtable "NOT_AUTHORIZED"
**Solution**: Check your Personal Access Token has correct scopes and base access.

### Issue: YouTube API returns empty data
**Solution**:
- Analytics data has 2-3 day delay
- Ensure video exists and has views
- Check date range is valid

### Issue: n8n workflow fails
**Solution**:
- Check execution log for errors
- Verify all credentials are connected
- Test each node individually

### Issue: Rate limit exceeded
**Solution**:
- Reduce sync frequency
- Add delay between API calls
- Process fewer videos per run

---

## ✅ Success Checklist

After setup, you should have:

- ✅ Google Cloud project with YouTube APIs enabled
- ✅ OAuth credentials configured
- ✅ Airtable base with Videos table
- ✅ Airtable API token
- ✅ n8n workflow created and tested
- ✅ Automated daily sync running
- ✅ Video metrics updating in Airtable

---

## 🔒 Security Best Practices

1. **Never share** your OAuth client secret
2. **Store credentials securely** in n8n (don't hardcode)
3. **Use environment variables** for sensitive data
4. **Rotate tokens** regularly
5. **Monitor API usage** for anomalies
6. **Enable 2FA** on all accounts

---

## 💰 Cost Breakdown

### Free Tier (Recommended for Starting)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| Google Cloud | Free | 10,000 API units/day |
| Airtable | Free | 1,200 records, 1,000 API calls/month |
| n8n Self-hosted | Free | Unlimited workflows |

**Total Cost: $0/month**

### Paid Tier (For Scale)

| Service | Plan | Cost |
|---------|------|------|
| Google Cloud | Standard | Free (within quota) |
| Airtable Plus | Plus | $20/month |
| n8n Cloud | Starter | $20/month |

**Total Cost: $40/month**

---

## 📞 Support

### Get Help
- [YouTube Analytics API Docs](https://developers.google.com/youtube/analytics)
- [Airtable Support](https://support.airtable.com/)
- [n8n Community](https://community.n8n.io/)

### Common Questions

**Q: How often should I sync?**
A: Daily is recommended. YouTube analytics have 2-3 day delay, so hourly syncing won't give new data.

**Q: Can I track competitor videos?**
A: Only with YouTube Data API (public metrics). Analytics API only works for your own channel.

**Q: What if I have multiple channels?**
A: Create separate workflows for each channel, or use filters in a single workflow.

**Q: How do I increase API quota?**
A: Request increase in Google Cloud Console → APIs & Services → Quotas.

---

**Congratulations! 🎉**

Your YouTube metrics are now automatically syncing to Airtable!

---

**Last Updated**: January 2025
**Setup Time**: ~30 minutes
**Difficulty**: Beginner-Friendly
