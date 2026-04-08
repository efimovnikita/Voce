# Implementation Plan: Mistral Speaker MVP

## Phase 1: Project Initialization & PWA Setup [checkpoint: 43391e8]
- [x] Task: Initialize React project with Vite and Tailwind CSS (ba3259c)
    - [ ] Write Tests: Verify project structure and basic dependencies
    - [ ] Implement: Run `npm create vite@latest`, install Tailwind
- [x] Task: Configure PWA Manifest and Service Worker (0f71266)
    - [ ] Write Tests: Verify manifest.json exists and has correct fields
    - [ ] Implement: Add `manifest.json`, register service worker
- [x] Task: Implement PWA Share Target (f2fe43e)
    - [ ] Write Tests: Verify `share_target` in manifest.json
    - [ ] Implement: Configure `share_target` in `manifest.json`
- [x] Task: Conductor - User Manual Verification 'Project Initialization & PWA Setup' (Protocol in workflow.md)

## Phase 2: Core UI Components [checkpoint: d8e9243]
- [x] Task: Create Settings Screen (API Key & Voice Selection) (313e976)
    - [ ] Write Tests: Verify input field and select dropdown
    - [ ] Implement: Build Settings component with `localStorage` persistence
- [x] Task: Create Player UI (Controls & Visuals) (17d758a)
    - [ ] Write Tests: Verify Play/Pause and Rewind buttons
    - [ ] Implement: Build Player component with progress bar and waveform placeholder
- [x] Task: Conductor - User Manual Verification 'Core UI Components' (Protocol in workflow.md)

## Phase 3: Mistral API & Audio Logic [checkpoint: 7a96473]
- [x] Task: Implement Mistral API Client (d94ba8d)
    - [ ] Write Tests: Mock API responses for voices and speech
    - [ ] Implement: Create API client for `fetchVoices` and `generateSpeech`
- [x] Task: Implement Sequential Chunking Logic (fbfb72e)
    - [ ] Write Tests: Verify text splitting and sequential request handling
    - [ ] Implement: Add logic to split long text and queue audio generation
- [x] Task: Conductor - User Manual Verification 'Mistral API & Audio Logic' (Protocol in workflow.md)

## Phase 4: Integration & Share Handling
- [x] Task: Handle Incoming Shared Text (f76bc16)
    - [ ] Write Tests: Mock URL parameters for `share_target`
    - [ ] Implement: Add logic to parse shared text and initiate playback
- [x] Task: Final Integration & Styling (89b76cb)
    - [ ] Write Tests: Verify end-to-end flow (Mocked API)
    - [ ] Implement: Connect all components and apply final Tailwind styling
- [ ] Task: Conductor - User Manual Verification 'Integration & Share Handling' (Protocol in workflow.md)
