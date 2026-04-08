# Track Specification: Mistral Speaker MVP

## 1. Overview
This track focuses on building the core Minimum Viable Product (MVP) of the Mistral Speaker application. The goal is to provide a functional PWA that can receive shared text and read it aloud using the Mistral AI TTS API.

## 2. Functional Requirements
### 2.1 PWA & OS Integration
- Register as a `share_target` for "text/plain" and "url" to receive shared content.
- Functional Service Worker for basic offline resource caching.
- Custom Web App Manifest with app icons and share configuration.

### 2.2 Core Audio Player
- Play/Pause controls.
- 10-second rewind (-10s) button.
- Progress bar showing playback status.
- Waveform visualization (placeholder or simple CSS/Canvas implementation).

### 2.3 Mistral TTS API Integration
- Fetch available voices list from Mistral API.
- Generate and play audio streams for shared text.
- Implement sequential chunking logic to handle long text content (e.g., articles) by splitting them into smaller parts for the API.

### 2.4 User Settings
- Settings screen for user to input and save their Mistral API key.
- Dropdown menu for selecting the preferred voice.
- Persistent storage of settings in `localStorage`.

## 3. Non-Functional Requirements
- **Performance:** Audio playback should start as quickly as possible after text is shared.
- **Responsive Design:** The UI must be fully functional and aesthetically pleasing on both mobile and desktop browsers (using Tailwind CSS).
- **Testability:** High unit test coverage (>80%) for all core logic.

## 4. Acceptance Criteria
1. The app successfully appears in the "Share" menu of the operating system.
2. Sharing a piece of text to the app triggers audio generation and playback.
3. The user can successfully save and update their Mistral API key in the settings.
4. The user can select from a list of voices fetched from the Mistral API.
5. Long texts are successfully chunked and played sequentially.

## 5. Out of Scope for MVP
- Storing generated audio files locally.
- Advanced voice configuration (pitch, speed, etc.).
- Account creation or cloud-based setting synchronization.
