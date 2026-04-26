/**
 * Extracts the YouTube Video ID from a variety of URL formats.
 * @param {string} url - The YouTube URL.
 * @returns {string|null} The 11-character video ID, or null if not found.
 */
export function getYoutubeVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Checks if a URL is a YouTube URL.
 * @param {string} url - The URL to check.
 * @returns {boolean} True if it's a YouTube URL.
 */
export function isYoutubeUrl(url) {
  return /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/.*$/.test(url);
}

/**
 * Fetches the transcript for a YouTube video using youtube-transcript.io API.
 * @param {string} videoId - The YouTube Video ID.
 * @param {string} apiKey - The API Key for youtube-transcript.io.
 * @param {string} proxyUrl - Optional CORS Proxy URL.
 * @returns {Promise<string>} The concatenated transcript text.
 */
export async function fetchYoutubeTranscript(videoId, apiKey, proxyUrl) {
  try {
    let endpoint = 'https://www.youtube-transcript.io/api/transcripts';
    const body = JSON.stringify({ ids: [videoId] });
    const headers = {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json'
    };

    let response;
    
    if (proxyUrl) {
      // Use the existing serverless proxy logic
      const baseProxy = proxyUrl.endsWith('/') ? proxyUrl.slice(0, -1) : proxyUrl;
      const proxyEndpoint = `${baseProxy}?url=${encodeURIComponent(endpoint)}`;
      
      response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: headers,
        body: body
      });
    } else {
      // Direct call (will likely fail due to CORS in browser)
      response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: body
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`YouTube Transcript API error (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    console.log('YouTube Transcript API Response:', data);
    
    let videoData;
    if (Array.isArray(data)) {
      // Search by ID or take the first element if it's a single-result array
      videoData = data.find(item => item.id === videoId || item.videoId === videoId) || data[0];
    } else if (data[videoId]) {
      // Format where keys are video IDs
      videoData = data[videoId];
    } else {
      // Maybe the response is the video object itself
      videoData = data;
    }

    if (!videoData) {
      throw new Error(`Video ID ${videoId} not found in the API response.`);
    }

    // Support both 'transcript' and 'text' fields from the API
    const transcript = videoData.transcript || videoData.text;

    // Check for success status or presence of transcript
    if (videoData.status === 'error' || !transcript) {
       throw new Error(`Failed to fetch transcript: ${videoData.message || 'No transcript text found in response'}`);
    }

    // Handle transcript being a string or an array of segments
    if (typeof transcript === 'string') {
      return transcript;
    } else if (Array.isArray(transcript)) {
      return transcript.map(segment => (typeof segment === 'string' ? segment : (segment.text || ''))).join(' ');
    } else {
      throw new Error('Transcript format is unrecognized (not a string or array).');
    }

  } catch (error) {
    console.error('YouTube Transcript fetch error:', error);
    throw error;
  }
}
