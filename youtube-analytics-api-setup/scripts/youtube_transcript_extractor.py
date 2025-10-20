#!/usr/bin/env python3

import sys
import re
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url):
    """Extract video ID from various YouTube URL formats"""
    patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([^&\n?#]+)',
        r'(?:https?://)?(?:www\.)?youtu\.be/([^&\n?#]+)',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([^&\n?#]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def get_transcript(video_id):
    """Get transcript for a YouTube video"""
    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_data = ytt_api.fetch(video_id)
        
        # Combine all transcript segments into one text
        full_transcript = ' '.join([entry.text for entry in transcript_data])
        
        return full_transcript
    
    except Exception as e:
        return f"Error getting transcript: {str(e)}"

def main():
    if len(sys.argv) != 2:
        print("Usage: python youtube_transcript_extractor.py <youtube_url>")
        sys.exit(1)
    
    youtube_url = sys.argv[1]
    
    # Extract video ID
    video_id = extract_video_id(youtube_url)
    if not video_id:
        print("Invalid YouTube URL")
        sys.exit(1)
    
    print(f"Extracting transcript for video ID: {video_id}")
    
    # Get transcript
    transcript = get_transcript(video_id)
    
    # Save to file
    filename = f"transcript_{video_id}.txt"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(transcript)
    
    print(f"Transcript saved to: {filename}")
    print("\nTranscript preview:")
    print("-" * 50)
    print(transcript[:500] + "..." if len(transcript) > 500 else transcript)

if __name__ == "__main__":
    main()