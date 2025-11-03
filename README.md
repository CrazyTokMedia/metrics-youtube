# YouTube Metrics to Airtable Integration
## 📥 Download

[Download v1.0.3](https://github.com/CrazyTokMedia/metrics-youtube/releases/download/v1.0.3/youtube-treatment-helper-v1.0.3.zip)


## Overview

This project enables automated fetching of YouTube video performance metrics and uploading them to Airtable. It leverages the YouTube Analytics API with OAuth 2.0 authentication to access detailed video metrics and integrates with Airtable's API for data storage and management.

**NEW: Chrome Extension Prototype** - We've built a working Chrome extension that helps compare YouTube video performance before/after treatments (title changes, thumbnail updates, etc.) directly in YouTube Studio - no OAuth setup required!

## Project Purpose

- **Fetch YouTube Metrics**: Retrieve comprehensive video performance data including views, engagement, demographics, and revenue metrics
- **Airtable Integration**: Store and manage video metrics in Airtable for analysis and reporting
- **Automation**: Use n8n workflows to automate the data sync process
- **Data-Driven Decisions**: Enable content strategy optimization based on performance metrics
- **Treatment Comparison**: Compare PRE vs POST video performance after making changes (Chrome Extension)

## Key Features

### API Integration (OAuth Method)
- OAuth 2.0 authentication for secure YouTube API access
- Support for all YouTube Analytics API metrics (30+ metrics)
- Automated batch processing of video lists from Airtable
- n8n workflow templates for scheduled sync
- Error handling and retry mechanisms
- Rate limiting compliance with YouTube API quotas

### Chrome Extension (No OAuth Required) ✨ PRODUCTION READY
- Calculate symmetric PRE/POST date ranges for treatment comparison
- One-click automatic metrics extraction (Views, CTR, AWT, Consumption)
- Real-time extraction with progress indicators
- Side-by-side PRE/POST metrics comparison
- Works directly in YouTube Studio (uses existing login)
- Test on private videos with low views
- No API setup or quota concerns
- Phase 1 + Phase 2 complete and tested!

## Documentation Structure

### Chrome Extension (Quick Start Here!) 🚀
- **[Extension Installation Guide](./extension/INSTALL_GUIDE.md)** - 5-minute setup to start testing the prototype
- **[Extension README](./extension/README.md)** - User guide and usage instructions
- **[Development Guide](./extension/DEVELOPMENT.md)** - Technical documentation for developers

### Research & Planning Docs
- **[Chrome Extension Automation](./docs/chrome-extension-automation.md)** - Build Chrome extension for YouTube Studio automation (no OAuth needed)
- **[Chrome Extension Resources](./docs/chrome-extension-resources.md)** - Open-source repos and code examples for browser automation
- **[vidIQ & TubeBuddy Deep Analysis](./docs/vidiq-tubebuddy-deep-analysis.md)** - Comprehensive technical analysis of how commercial YouTube extensions work

### API Integration Docs
- **[YouTube API Guide](./docs/youtube-api-guide.md)** - Complete YouTube Analytics API documentation with OAuth setup
- **[Airtable Integration](./docs/airtable-integration.md)** - Airtable API setup and data schema
- **[n8n Workflows](./docs/n8n-workflows.md)** - n8n automation setup and templates
- **[Metrics Reference](./docs/metrics-reference.md)** - Comprehensive list of all available YouTube metrics
- **[Quick Start Guide](./docs/quickstart.md)** - Step-by-step setup instructions

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│  Airtable   │ ──────> │   n8n Workflow   │ ──────> │   YouTube    │
│ (Video IDs) │         │   (Orchestrator) │         │ Analytics API│
└─────────────┘         └──────────────────┘         └──────────────┘
      ▲                          │                            │
      │                          │                            │
      │                          ▼                            │
      │                  ┌──────────────┐                     │
      └──────────────────│  OAuth 2.0   │◄────────────────────┘
                         │    Server    │
                         └──────────────┘
```

## Technology Stack

- **YouTube Analytics API** - Data source for video metrics
- **YouTube Data API v3** - Video metadata and public information
- **Airtable API** - Data storage and management
- **n8n** - Workflow automation platform
- **OAuth 2.0** - Secure authentication protocol

## Prerequisites

1. Google Cloud Platform account with YouTube Analytics API enabled
2. Airtable account with API access
3. n8n instance (cloud or self-hosted)
4. YouTube channel with videos to track

## Quick Start

### Option 1: Chrome Extension (Fastest - 5 minutes) ⚡

Perfect for testing treatment comparison on your own YouTube channel:

1. **[Follow Installation Guide](./extension/INSTALL_GUIDE.md)** - Load extension in Chrome
2. Navigate to YouTube Studio Analytics
3. Click "Treatment Comparison" button
4. Enter treatment date and compare PRE/POST periods

**No OAuth setup, no API keys, works with private videos!**

### Option 2: Full API Integration (Complete automation)

For automated sync to Airtable with n8n workflows:

1. Set up Google Cloud OAuth 2.0 credentials (see [YouTube API Guide](./docs/youtube-api-guide.md))
2. Configure Airtable base and table structure (see [Airtable Integration](./docs/airtable-integration.md))
3. Import n8n workflow template (see [n8n Workflows](./docs/n8n-workflows.md))
4. Authorize OAuth access and configure credentials
5. Run your first sync

## API Quotas and Limits

### YouTube Analytics API
- **Quota**: 10,000 units per day (default)
- **Rate Limit**: 1 request per second per user
- **Metrics per request**: Up to 10 metrics

### Airtable API
- **Rate Limit**: 5 requests per second per base
- **Records per request**: 10 records max for create/update

### n8n
- **Cloud**: Workflow execution limits based on plan
- **Self-hosted**: No execution limits

## Security Considerations

- Store OAuth credentials securely (use environment variables or secret managers)
- Never commit `.env` files or credentials to version control
- Implement token refresh mechanisms for long-running workflows
- Use HTTPS for all API communications
- Regularly rotate API keys and review access permissions

## Cost Considerations

- **YouTube API**: Free (within quota limits)
- **Airtable**: Free tier available, paid plans for advanced features
- **n8n**: Free self-hosted, cloud plans start at $20/month
- **Google Cloud**: OAuth and API usage is free

## Common Use Cases

1. **Daily Metrics Sync**: Automated daily refresh of video performance metrics
2. **Competitor Analysis**: Track competitor video performance alongside your own
3. **Content Strategy**: Identify top-performing content patterns
4. **Revenue Tracking**: Monitor monetization metrics for business reporting
5. **Audience Insights**: Analyze viewer demographics and engagement patterns

## Support and Resources

- [YouTube Analytics API Official Docs](https://developers.google.com/youtube/analytics)
- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [n8n Documentation](https://docs.n8n.io/)
- [OAuth 2.0 Guide](https://oauth.net/2/)

## Project Status

### Chrome Extension
✅ Phase 1 (Date Range Calculator) - Complete
✅ Phase 2 (Automatic Metrics Extraction) - Complete and tested
✅ Integration - Production ready and deployed
⏳ Phase 3 (Airtable Integration) - Optional enhancement

### API Integration
✅ Documentation complete
✅ Architecture designed
⏳ Implementation pending
⏳ Testing pending

## License

[Specify your license here]

## Contributing

[Contribution guidelines if applicable]

---

**Last Updated**: January 2025
**Maintained By**: CrazyTok Media
