# Implementation Plan: Minimal UI Refactor (Non-TDD)

## Phase 1: Settings Refactor & Modal Integration
- [ ] Task: Create a `Modal` component (or use a simple Tailwind overlay) for settings.
- [ ] Task: Refactor `src/components/Settings.jsx` to function within the new Modal.
- [ ] Task: Add a small Icon Button (Gear icon) to the top corner of the application.
- [ ] Task: Connect the Icon Button to the Modal state (Open/Close).
- [ ] Task: Conductor - User Manual Verification 'Settings Refactor' (Protocol in workflow.md - Skipping automated tests)

## Phase 2: Player & Layout Simplification
- [ ] Task: Update `src/components/Player.jsx` to use a minimal layout.
- [ ] Task: Implement the "Top Status Bar" to display the application's current state.
- [ ] Task: Center the playback controls (Play/Pause, Rewind) below the status bar.
- [ ] Task: Ensure the decorative histogram is correctly positioned and animated in the minimal view.
- [ ] Task: Clean up `src/App.jsx` to remove any legacy layout elements.
- [ ] Task: Conductor - User Manual Verification 'Minimal Player UI' (Protocol in workflow.md - Skipping automated tests)

## Phase 3: Styling & Responsive Polish
- [ ] Task: Apply final Tailwind styling to the status bar and controls for a "premium" feel.
- [ ] Task: Verify the layout on mobile (responsive check).
- [ ] Task: Final audit to ensure no tests were added and the TDD-free workflow was maintained.
- [ ] Task: Conductor - User Manual Verification 'Final Integration' (Protocol in workflow.md - Skipping automated tests)
