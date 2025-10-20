#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
YouTube Analytics API Example
Demonstrates how to access YouTube Analytics data for YOUR channels

Requirements:
1. OAuth 2.0 client credentials (client_secret.json)
2. YouTube channel ownership/management access
3. YouTube Analytics API enabled in Google Cloud Console

First run will open browser for authentication.
"""

import os
import json
import datetime
import pickle
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# OAuth 2.0 scopes
SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly'
]

def get_authenticated_service():
    """
    Authenticate using OAuth 2.0 and return YouTube Analytics service

    First time: Opens browser for authentication
    Subsequent runs: Uses saved token
    """
    credentials = None
    token_path = Path(__file__).parent.parent / 'credentials' / 'token.pickle'
    client_secret_path = Path(__file__).parent.parent / 'credentials' / 'client_secret.json'

    # Check if we have saved credentials
    if token_path.exists():
        print('Loading saved credentials...')
        with open(token_path, 'rb') as token:
            credentials = pickle.load(token)

    # If no valid credentials, authenticate
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            print('Refreshing expired credentials...')
            credentials.refresh(Request())
        else:
            if not client_secret_path.exists():
                print('ERROR: client_secret.json not found!')
                print(f'Expected location: {client_secret_path}')
                print('See README.md for OAuth setup instructions')
                return None

            print('Starting OAuth flow...')
            print('Your browser will open for authentication.')
            flow = InstalledAppFlow.from_client_secrets_file(
                str(client_secret_path),
                SCOPES
            )
            credentials = flow.run_local_server(
                port=8080,
                prompt='consent',
                access_type='offline'
            )

        # Save credentials for next run
        print(f'Saving credentials to {token_path}')
        with open(token_path, 'wb') as token:
            pickle.dump(credentials, token)

    print('Authentication successful!')

    # Build YouTube Analytics API service
    youtube_analytics = build('youtubeAnalytics', 'v2', credentials=credentials)

    # Also build YouTube Data API for channel info
    youtube_data = build('youtube', 'v3', credentials=credentials)

    return youtube_analytics, youtube_data

def get_channel_info(youtube_data):
    """Get information about authenticated channel"""
    try:
        request = youtube_data.channels().list(
            part='snippet,statistics',
            mine=True
        )
        response = request.execute()

        if not response.get('items'):
            print('No channel found for this account')
            return None

        channel = response['items'][0]
        channel_info = {
            'id': channel['id'],
            'title': channel['snippet']['title'],
            'description': channel['snippet']['description'][:100] + '...',
            'subscriber_count': channel['statistics'].get('subscriberCount', 'Hidden'),
            'video_count': channel['statistics']['videoCount'],
            'view_count': channel['statistics']['viewCount']
        }

        return channel_info
    except Exception as e:
        print(f'Error getting channel info: {e}')
        return None

def get_channel_analytics_last_30_days(youtube_analytics):
    """
    Get channel analytics for last 30 days

    Metrics:
    - views: Total views
    - estimatedMinutesWatched: Watch time
    - averageViewDuration: Average view duration (seconds)
    - subscribersGained: New subscribers
    - subscribersLost: Lost subscribers
    """
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=30)

    try:
        response = youtube_analytics.reports().query(
            ids='channel==MINE',
            startDate=start_date.isoformat(),
            endDate=end_date.isoformat(),
            metrics='views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost',
            dimensions='day',
            sort='day'
        ).execute()

        return response
    except Exception as e:
        print(f'Error getting analytics: {e}')
        return None

def get_traffic_sources(youtube_analytics, days=30):
    """Get traffic sources for last N days"""
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=days)

    try:
        response = youtube_analytics.reports().query(
            ids='channel==MINE',
            startDate=start_date.isoformat(),
            endDate=end_date.isoformat(),
            metrics='views,estimatedMinutesWatched',
            dimensions='insightTrafficSourceType',
            sort='-views'
        ).execute()

        return response
    except Exception as e:
        print(f'Error getting traffic sources: {e}')
        return None

def get_device_types(youtube_analytics, days=30):
    """Get views by device type"""
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=days)

    try:
        response = youtube_analytics.reports().query(
            ids='channel==MINE',
            startDate=start_date.isoformat(),
            endDate=end_date.isoformat(),
            metrics='views,estimatedMinutesWatched',
            dimensions='deviceType',
            sort='-views'
        ).execute()

        return response
    except Exception as e:
        print(f'Error getting device types: {e}')
        return None

def get_top_videos(youtube_analytics, days=30, max_results=10):
    """Get top performing videos by views"""
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=days)

    try:
        response = youtube_analytics.reports().query(
            ids='channel==MINE',
            startDate=start_date.isoformat(),
            endDate=end_date.isoformat(),
            metrics='views,estimatedMinutesWatched,averageViewDuration,likes,comments',
            dimensions='video',
            sort='-views',
            maxResults=max_results
        ).execute()

        return response
    except Exception as e:
        print(f'Error getting top videos: {e}')
        return None

def print_analytics_summary(analytics_data):
    """Pretty print analytics summary"""
    if not analytics_data or 'rows' not in analytics_data:
        print('No data available')
        return

    print('\n' + '='*60)
    print('DAILY ANALYTICS (Last 30 Days)')
    print('='*60)

    headers = analytics_data.get('columnHeaders', [])
    rows = analytics_data.get('rows', [])

    # Print header
    header_names = [h['name'] for h in headers]
    print('\t'.join(header_names))
    print('-'*60)

    # Print data
    total_views = 0
    total_watch_time = 0
    total_subs_gained = 0
    total_subs_lost = 0

    for row in rows:
        print('\t'.join(str(val) for val in row))
        if len(row) >= 2:
            total_views += int(row[1])
            total_watch_time += float(row[2]) if len(row) > 2 else 0
            total_subs_gained += int(row[4]) if len(row) > 4 else 0
            total_subs_lost += int(row[5]) if len(row) > 5 else 0

    print('='*60)
    print(f'TOTALS:')
    print(f'  Total Views: {total_views:,}')
    print(f'  Total Watch Time: {total_watch_time:,.0f} minutes ({total_watch_time/60:.1f} hours)')
    print(f'  Subscribers Gained: {total_subs_gained}')
    print(f'  Subscribers Lost: {total_subs_lost}')
    print(f'  Net Subscribers: {total_subs_gained - total_subs_lost}')
    print('='*60)

def print_traffic_sources(traffic_data):
    """Pretty print traffic sources"""
    if not traffic_data or 'rows' not in traffic_data:
        print('No traffic data available')
        return

    print('\n' + '='*60)
    print('TRAFFIC SOURCES (Last 30 Days)')
    print('='*60)

    rows = traffic_data.get('rows', [])

    for row in rows:
        source_type = row[0]
        views = int(row[1])
        watch_time = float(row[2])

        print(f'{source_type:30s}: {views:,} views | {watch_time:,.0f} min')

    print('='*60)

def main():
    print('YouTube Analytics API Example')
    print('='*60)

    # Authenticate
    services = get_authenticated_service()
    if not services:
        return

    youtube_analytics, youtube_data = services

    # Get channel info
    print('\n1. Getting channel information...')
    channel_info = get_channel_info(youtube_data)
    if channel_info:
        print(f"\nChannel: {channel_info['title']}")
        print(f"Subscribers: {channel_info['subscriber_count']}")
        print(f"Total Videos: {channel_info['video_count']}")
        print(f"Total Views: {channel_info['view_count']}")

    # Get last 30 days analytics
    print('\n2. Getting analytics for last 30 days...')
    analytics = get_channel_analytics_last_30_days(youtube_analytics)
    if analytics:
        print_analytics_summary(analytics)

    # Get traffic sources
    print('\n3. Getting traffic sources...')
    traffic = get_traffic_sources(youtube_analytics, days=30)
    if traffic:
        print_traffic_sources(traffic)

    # Get device breakdown
    print('\n4. Getting device type breakdown...')
    devices = get_device_types(youtube_analytics, days=30)
    if devices and 'rows' in devices:
        print('\nDevice Types:')
        for row in devices['rows']:
            print(f'  {row[0]:15s}: {int(row[1]):,} views')

    # Get top videos
    print('\n5. Getting top 10 videos...')
    top_videos = get_top_videos(youtube_analytics, days=30, max_results=10)
    if top_videos and 'rows' in top_videos:
        print('\nTop 10 Videos (by views):')
        for i, row in enumerate(top_videos['rows'], 1):
            video_id = row[0]
            views = int(row[1])
            print(f'  {i}. Video ID: {video_id} - {views:,} views')
            print(f'     https://www.youtube.com/watch?v={video_id}')

    # Save raw data
    output_file = 'analytics_export.json'
    export_data = {
        'channel_info': channel_info,
        'last_30_days': analytics,
        'traffic_sources': traffic,
        'device_types': devices,
        'top_videos': top_videos,
        'export_date': datetime.datetime.now().isoformat()
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print(f'\nRaw data saved to: {output_file}')
    print('\nDone!')

if __name__ == '__main__':
    main()
