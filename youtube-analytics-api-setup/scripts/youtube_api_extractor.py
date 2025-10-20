#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
YouTube Data API v3 extractor - uses Google Console project key
Gets metadata and captions for all videos
"""

import os
import json
import time
from dotenv import load_dotenv
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi

# Load environment variables
load_dotenv()

# ALL VIDEOS from the provided list
ALL_VIDEOS = [
    # LIVING IN DALLAS
    ("JguLkSGlhhU", "living_in_dallas", "LIVING IN DALLAS"),
    ("ndPcdsPOpQU", "living_in_dallas", "LIVING IN DALLAS"), 
    ("hbdkOnDXwJY", "living_in_dallas", "LIVING IN DALLAS"),
    ("cQQMjIn13kk", "living_in_dallas", "LIVING IN DALLAS"),
    ("ebqKsGDRT3M", "living_in_dallas", "LIVING IN DALLAS"),
    
    # Tom Storey
    ("UOoHzKCvqec", "tom_storey", "Tom Storey"),
    ("m9yWj6G1LxY", "tom_storey", "Tom Storey"),
    ("qMmreMDAOnk", "tom_storey", "Tom Storey"),
    ("lxErkN21Acw", "tom_storey", "Tom Storey"),
    ("kEDc3qNyaYk", "tom_storey", "Tom Storey"),
    
    # REAL ESTATE 100 SHOW
    ("ZpKZXm0BqIo", "realestate_100_show", "REAL ESTATE 100 SHOW"),
    ("9ECTG_YhnzY", "realestate_100_show", "REAL ESTATE 100 SHOW"),
    ("mb9JkQZwcfw", "realestate_100_show", "REAL ESTATE 100 SHOW"),
    ("Z2qTm4XYy20", "realestate_100_show", "REAL ESTATE 100 SHOW"),
    ("7zcG7KyL1Ns", "realestate_100_show", "REAL ESTATE 100 SHOW"),
    
    # Stephen Duncombe TV
    ("9KR8mCTGssM", "stephen_duncombe_tv", "Stephen Duncombe TV"),
    ("TMWxdkxHRvQ", "stephen_duncombe_tv", "Stephen Duncombe TV"),
    ("89h9xydVQL4", "stephen_duncombe_tv", "Stephen Duncombe TV"),
    ("o4J3naLM-1o", "stephen_duncombe_tv", "Stephen Duncombe TV"),
    ("zg1XXzT3BBU", "stephen_duncombe_tv", "Stephen Duncombe TV"),
    ("0NyOWS0qLmI", "stephen_duncombe_tv", "Stephen Duncombe TV"),
    ("8MXxY4yxRLU", "stephen_duncombe_tv", "Stephen Duncombe TV"),
    
    # Javy Vidana
    ("7GQF2q4zIA4", "javy_vidana", "Javy Vidana"),
    ("CVVSBt5mLEE", "javy_vidana", "Javy Vidana"),
    ("w6JLYOzVS6g", "javy_vidana", "Javy Vidana"),
    ("bqzHzqQZsPg", "javy_vidana", "Javy Vidana"),
    ("TUQt4WfNBRU", "javy_vidana", "Javy Vidana"),
    
    # Win The House You Love
    ("S-v9ZxJevfo", "win_the_house_you_love", "Win The House You Love"),
    ("xBtKMup3jVE", "win_the_house_you_love", "Win The House You Love"),
    ("9NE2Q_tniu4", "win_the_house_you_love", "Win The House You Love"),
    ("TheylbfroxY", "win_the_house_you_love", "Win The House You Love"),
    ("AiXb_c9kmM8", "win_the_house_you_love", "Win The House You Love"),
    
    # Graham Stephan
    ("bJx7_1rWC6U", "graham_stephan", "Graham Stephan")
]

def get_youtube_service():
    """Initialize YouTube Data API service"""
    api_key = os.getenv('GEMINI_API_KEY')  # Using the same Google Console key
    if not api_key:
        raise Exception("GEMINI_API_KEY not found in .env file")
    
    return build('youtube', 'v3', developerKey=api_key)

def get_video_metadata(youtube, video_id):
    """Get video metadata using YouTube Data API"""
    try:
        request = youtube.videos().list(
            part='snippet,statistics,contentDetails',
            id=video_id
        )
        response = request.execute()
        
        if not response['items']:
            return None
            
        video = response['items'][0]
        
        metadata = {
            'video_id': video_id,
            'url': f'https://www.youtube.com/watch?v={video_id}',
            'title': video['snippet']['title'],
            'description': video['snippet']['description'],
            'published_at': video['snippet']['publishedAt'],
            'channel_title': video['snippet']['channelTitle'],
            'channel_id': video['snippet']['channelId'],
            'duration': video['contentDetails']['duration'],
            'view_count': int(video['statistics'].get('viewCount', 0)),
            'like_count': int(video['statistics'].get('likeCount', 0)),
            'comment_count': int(video['statistics'].get('commentCount', 0)),
            'tags': video['snippet'].get('tags', []),
            'category_id': video['snippet']['categoryId'],
            'default_language': video['snippet'].get('defaultLanguage'),
            'extraction_date': time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return metadata
        
    except Exception as e:
        print(f"Error getting metadata for {video_id}: {e}")
        return None

def get_transcript_fallback(video_id):
    """Try to get transcript using the transcript API as fallback"""
    try:
        transcript_api = YouTubeTranscriptApi()
        transcript_result = transcript_api.fetch(video_id)
        raw_data = transcript_result.to_raw_data()
        full_text = " ".join([item['text'] for item in raw_data])
        return full_text.strip()
    except Exception as e:
        print(f"Transcript fallback failed for {video_id}: {e}")
        return None

def get_captions_via_api(youtube, video_id):
    """Try to get captions using YouTube Data API"""
    try:
        # List available captions
        captions_request = youtube.captions().list(
            part='snippet',
            videoId=video_id
        )
        captions_response = captions_request.execute()
        
        if not captions_response['items']:
            return None
        
        # Find English captions
        caption_id = None
        for item in captions_response['items']:
            if item['snippet']['language'] == 'en':
                caption_id = item['id']
                break
        
        if not caption_id and captions_response['items']:
            # Use first available if no English found
            caption_id = captions_response['items'][0]['id']
        
        if caption_id:
            # Download caption
            caption_request = youtube.captions().download(
                id=caption_id,
                tfmt='srt'
            )
            caption_content = caption_request.execute()
            return caption_content
        
        return None
        
    except Exception as e:
        print(f"API captions failed for {video_id}: {e}")
        return None

def extract_video_data(youtube, video_id, channel_folder, channel_name):
    """Extract all data for a single video"""
    print(f"Processing {video_id} ({channel_name})")
    
    # Create video directory
    video_dir = os.path.join("all_videos_data", f"{video_id}_{channel_folder}")
    os.makedirs(video_dir, exist_ok=True)
    
    # Get metadata via API
    metadata = get_video_metadata(youtube, video_id)
    if metadata:
        with open(os.path.join(video_dir, "metadata.json"), 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        print(f"  ✓ Saved metadata: {metadata['title'][:50]}...")
    else:
        # Fallback basic metadata
        basic_metadata = {
            'video_id': video_id,
            'url': f'https://www.youtube.com/watch?v={video_id}',
            'channel_folder': channel_folder,
            'channel_name': channel_name,
            'extraction_date': time.strftime("%Y-%m-%d %H:%M:%S"),
            'note': 'Basic metadata - API failed'
        }
        with open(os.path.join(video_dir, "metadata.json"), 'w', encoding='utf-8') as f:
            json.dump(basic_metadata, f, indent=2, ensure_ascii=False)
        print(f"  ✓ Saved basic metadata")
    
    # Try to get transcript/captions
    transcript = None
    
    # Method 1: Try API captions
    transcript = get_captions_via_api(youtube, video_id)
    if transcript:
        print(f"  ✓ Got captions via API")
    else:
        # Method 2: Try transcript API fallback
        transcript = get_transcript_fallback(video_id)
        if transcript:
            print(f"  ✓ Got transcript via fallback")
    
    # Save transcript if we got it
    if transcript:
        with open(os.path.join(video_dir, "transcript.txt"), 'w', encoding='utf-8') as f:
            f.write(transcript)
        word_count = len(transcript.split())
        print(f"  ✓ Saved transcript: {word_count} words")
        return True
    else:
        print(f"  ✗ No transcript available")
        return False

def main():
    print("YouTube Data API v3 Extractor")
    print("=" * 50)
    
    # Initialize YouTube service
    try:
        youtube = get_youtube_service()
        print("✓ YouTube API initialized")
    except Exception as e:
        print(f"✗ Failed to initialize YouTube API: {e}")
        return
    
    # Create output directory
    os.makedirs("all_videos_data", exist_ok=True)
    
    successful = 0
    failed = 0
    
    print(f"\nProcessing all {len(ALL_VIDEOS)} videos...")
    print("=" * 50)
    
    for i, (video_id, channel_folder, channel_name) in enumerate(ALL_VIDEOS):
        print(f"\n[{i+1}/{len(ALL_VIDEOS)}]", end=" ")
        
        success = extract_video_data(youtube, video_id, channel_folder, channel_name)
        
        if success:
            successful += 1
        else:
            failed += 1
        
        # Rate limiting for API
        if i < len(ALL_VIDEOS) - 1:
            print(f"  Waiting 2 seconds...")
            time.sleep(2)
    
    print(f"\n" + "=" * 50)
    print(f"EXTRACTION COMPLETE")
    print(f"Successful: {successful}/{len(ALL_VIDEOS)}")
    print(f"Failed: {failed}/{len(ALL_VIDEOS)}")
    print(f"Data saved in: {os.path.abspath('all_videos_data')}")

if __name__ == "__main__":
    main()