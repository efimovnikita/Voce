# Implementation Plan: Mistral Speaker MVP

## Phase 1: Project Initialization & PWA Setup
- [~] Task: Initialize React project with Vite and Tailwind CSS
    - [ ] Write Tests: Verify project structure and basic dependencies
    - [ ] Implement: Run `npm create vite@latest`, install Tailwind
- [ ] Task: Configure PWA Manifest and Service Worker
    - [ ] Write Tests: Verify manifest.json exists and has correct fields
    - [ ] Implement: Add `manifest.json`, register service worker
- [ ] Task: Implement PWA Share Target
    - [ ] Write Tests: Verify `share_target` in manifest.json
    - [ ] Implement: Configure `share_target` in `manifest.json`
- [ ] Task: Conductor - User Manual Verification 'Project Initialization & PWA Setup' (Protocol in workflow.md)

## Phase 2: Core UI Components
- [ ] Task: Create Settings Screen (API Key & Voice Selection)
    - [ ] Write Tests: Verify input field and select dropdown
    - [ ] Implement: Build Settings component with `localStorage` persistence
- [ ] Task: Create Player UI (Controls & Visuals)
    - [ ] Write Tests: Verify Play/Pause and Rewind buttons
    - [ ] Implement: Build Player component with progress bar and waveform placeholder
- [ ] Task: Conductor - User Manual Verification 'Core UI Components' (Protocol in workflow.md)

## Phase 3: Mistral API & Audio Logic
- [ ] Task: Implement Mistral API Client
    - [ ] Write Tests: Mock API responses for voices and speech
    - [ ] Implement: Create API client for `fetchVoices` and `generateSpeech`
- [ ] Task: Implement Sequential Chunking Logic
    - [ ] Write Tests: Verify text splitting and sequential request handling
    - [ ] Implement: Add logic to split long text and queue audio generation
- [ ] Task: Conductor - User Manual Verification 'Mistral API & Audio Logic' (Protocol in workflow.md)

## Phase 4: Integration & Share Handling
- [ ] Task: Handle Incoming Shared Text
    - [ ] Write Tests: Mock URL parameters for `share_target`
    - [ ] Implement: Add logic to parse shared text and initiate playback
- [ ] Task: Final Integration & Styling
    - [ ] Write Tests: Verify end-to-end flow (Mocked API)
    - [ ] Implement: Connect all components and apply final Tailwind styling
- [ ] Task: Conductor - User Manual Verification 'Integration & Share Handling' (Protocol in workflow.md)
