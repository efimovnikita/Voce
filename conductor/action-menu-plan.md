# Action Menu Implementation Plan

## Objective
Implement an Action Menu (three-dot dropdown) in the top bar to consolidate track-related actions ("Download offline", "Copy chunks", and "Delete article"). This provides a scalable UI for track management without cluttering the screen.

## Key Files & Context
- `src/App.jsx`: State management and top-bar UI.

## Implementation Steps
1.  **State Management**: Add a boolean state `isActionMenuOpen` to toggle the visibility of the new menu.
2.  **UI Modification (Top Bar)**:
    - Replace the current "Download" button with a vertical ellipsis (⋮) icon button.
    - Remove the `onClick={handleCopyChunks}` handler from the track title (making the title just display text).
3.  **Dropdown Menu Component**:
    - Create a small floating menu positioned below the three-dot button.
    - Add a backdrop (invisible overlay) that closes the menu when clicking outside.
4.  **Menu Items**:
    - **Download Audio**: Triggers `handleDownloadOffline`.
    - **Copy Text Chunks**: Triggers `handleCopyChunks`.
    - **Delete Article**: Triggers a new function `handleDeleteCurrentTrack`.
5.  **Implementation of `handleDeleteCurrentTrack`**:
    - Ask for confirmation via `window.confirm`.
    - Find the current track's ID.
    - Remove the track from the `playlist` state and update `localforage` ('mistral_playlist').
    - Clean up any downloaded offline audio chunks for this specific track from `localforage` (`offline_audio_${trackId}_*`).
    - If the playlist is empty after deletion, reset to empty state. If not, automatically transition to the next available track (or previous if it was the last track).
    - Close the menu.

## Verification & Testing
- Ensure the menu opens/closes correctly, including outside clicks.
- Verify "Download Audio" works as before.
- Verify "Copy Text Chunks" works as before.
- Verify "Delete Article" successfully removes the item from UI, persistent storage, clears its offline cache, and properly shifts playback to a valid state.
