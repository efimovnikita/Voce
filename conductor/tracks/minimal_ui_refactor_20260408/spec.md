# Specification: Minimal UI Refactor & Test-Free Workflow

## 1. Overview
The goal of this track is to transition the Mistral Speaker UI from its current layout to a highly minimal, "player-centric" experience. This involves hiding configuration details behind a modal and focusing the primary interface on immediate status and controls. Additionally, this track adopts a streamlined development workflow that bypasses Test-Driven Development (TDD) and automated test verification.

## 2. Functional Requirements
- **Top Status Bar:** A minimal status line at the top of the viewport indicating the current state (e.g., "Ready to read", "Processing...", "Speaking").
- **Minimal Control Set:**
  - **Play/Pause Toggle:** Primary action button.
  - **Rewind Button:** For jumping back (e.g., -10s).
  - **Decorative Histogram:** A visual waveform animation that remains visible during playback.
- **Hidden Settings Panel:**
  - The current settings (API key, voice selection) must be removed from the main view.
  - A small **Icon Button** (e.g., a gear) will be added to trigger the settings.
  - Settings will appear in a **Modal/Overlay**, allowing for a distraction-free main interface.
- **Workflow Modification:**
  - **No TDD:** Development will skip the "Write Failing Tests" and "Implement to Pass Tests" phases.
  - **No Automated Verification:** Phase completion will not require automated test execution or coverage checks.

## 3. Acceptance Criteria
- [ ] The app launches with a minimal top-aligned status bar and controls.
- [ ] Settings are hidden by default.
- [ ] Clicking the icon button successfully opens the settings modal.
- [ ] Playback and histogram visualization function correctly in the new minimal layout.
- [ ] The development process proceeds directly to implementation without unit tests.

## 4. Out of Scope
- Adding new features beyond the UI refactor.
- Writing any unit, integration, or end-to-end tests during this track.
- Modifying the core TTS logic (except where necessary for the UI binding).
