# Specification: YouTube Transcript Support

## 1. Overview
The goal is to provide custom handling for shared YouTube links. Instead of using the generic CORS proxy and Readability parser (which fail on YouTube), the app will detect YouTube links, extract the video ID, and fetch the transcript using the `youtube-transcript.io` API.

## 2. Requirements
- **Settings:** Add a new field in the Settings UI for the "YouTube Transcript API Key". Persist it in `localStorage`.
- **URL Detection:** Modify the URL processing logic in `App.jsx` to identify `youtube.com` and `youtu.be` links.
- **Transcript Extraction:** When a YouTube link is detected, extract the Video ID and send a POST request to `https://www.youtube-transcript.io/api/transcripts` using the provided API key. The JSON response must be parsed to extract the transcript text.
- **Fallback:** For non-YouTube links, the existing CORS Proxy + Readability logic must remain untouched.
- **Title:** Retain the existing title extraction logic (`initialTitle = "Generating title..."`, `isTitleGenerated = false`). This allows the existing system to automatically generate an appropriate title from the downloaded transcript text using Mistral AI.

## 3. Acceptance Criteria
- [ ] User can enter and save the YouTube Transcript API Key in Settings.
- [ ] Sharing a YouTube link triggers the new logic instead of the CORS proxy.
- [ ] The app successfully extracts the video ID from various YouTube URL formats.
- [ ] The app fetches the transcript, concatenates the text segments, and creates a track ready for playback.
- [ ] The existing AI-based title generation logic successfully generates a title for the YouTube transcript.
- [ ] Non-YouTube links continue to work via the CORS proxy.