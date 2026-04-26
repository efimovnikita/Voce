# Implementation Plan: YouTube Transcript Support (Test-Free)

## Phase 1: Settings Update
- [x] Task: Add `youtube_transcript_api_key` state and local storage handling in `src/components/Settings.jsx`.
- [x] Task: Update the Settings UI to include a text input for the YouTube Transcript API Key.

## Phase 2: YouTube API Utility
- [x] Task: Create a new utility module `src/api/youtube.js` for handling YouTube specific logic.
- [x] Task: Implement a function to extract the Video ID from a given URL.
- [x] Task: Implement `fetchYoutubeTranscript(videoId, apiKey)` function that makes a POST request to `https://www.youtube-transcript.io/api/transcripts` and returns the concatenated transcript text.

## Phase 3: Integration in App.jsx
- [x] Task: In `App.jsx`, update the URL processing logic inside the `useEffect` that handles incoming links.
- [x] Task: If the URL is a YouTube link, check if the YouTube API key exists in settings. If not, show an error.
- [x] Task: If the API key exists, call `fetchYoutubeTranscript`, retrieve the text, and proceed with track creation using the existing initial title and title-generation flags.
- [x] Task: Fallback to the existing `fetchAndParseArticle` for non-YouTube URLs.

## Phase 4: Verification
- [x] Task: Conductor - User Manual Verification for testing YouTube URL sharing and transcript extraction.