# Implementation Plan: Per-Article Mode Selection and Persistence

This plan describes the changes needed to allow users to individually select and remember the 'original' or 'simplified' mode for each imported article.

## Objective
- Store the selected mode (original/simplified) for each article in the playlist.
- Ensure the UI (toggle slider) reflects the mode of the currently selected article.
- Use the per-article mode during playback, text copying, and bulk downloading.
- Maintain a global default mode for new article imports.

## Key Files & Context
- `src/App.jsx`: Main application logic, state management for playlist and current mode.
- `src/utils/download.js`: Utility for downloading articles, needs to respect per-article mode.
- `src/components/BulkDownloadPanel.jsx`: UI for mass downloading, needs to respect per-article mode.

## Implementation Steps

### 1. Update Article Creation Logic (`src/App.jsx`)
- In `processNewSharedText`, when creating a `newTrack` object, add a `mode` property.
- The initial value should be determined by the current global `isSimplifyMode` state.

### 2. Update Mode Toggle Logic (`src/App.jsx`)
- Modify `handleModeToggle` to:
    1. Update the `isSimplifyMode` state (global/current UI state).
    2. Update the `mode` property of the currently selected track in the `playlist`.
    3. Persist the updated playlist to `localforage`.
    4. Keep updating `localStorage.setItem('mistral_simplify_mode', ...)` to act as the default for future imports.

### 3. Synchronize UI with Current Track (`src/App.jsx`)
- Add a `useEffect` or update the `setCurrentTrackIndex` calls to ensure `isSimplifyMode` reflects the `mode` of the newly selected track.
- If a track doesn't have a `mode` property (legacy data), it should default to the current `isSimplifyMode`.

### 4. Update Playback and Copy Logic (`src/App.jsx`)
- Ensure `processAndPlay` and `handleCopyChunks` use the mode specifically from the current track object if available, though keeping the `isSimplifyMode` state in sync with the current track makes this almost automatic.

### 5. Update Download Logic (`src/utils/download.js`)
- Modify `downloadArticle` to prioritize `article.mode` over the passed `isSimplifyMode` parameter.

### 6. Update Bulk Download UI (`src/components/BulkDownloadPanel.jsx`)
- Update the progress list to show the mode of each individual track.
- Ensure the download loop uses the specific mode of each track.

## Verification & Testing

### Manual Testing
1. **Importing:** Import a new article and verify it "inherits" the current global mode.
2. **Switching Mode:** Change the mode for Article A to "Simplified". Switch to Article B (which is "Original"). Switch back to Article A and verify the slider moves back to "Simplified".
3. **Persistence:** Refresh the page and verify Article A is still in "Simplified" mode.
4. **Playback:** Verify that clicking play on Article A uses simplified text, and on Article B uses original text.
5. **Bulk Download:** Verify that "Download All" correctly downloads Article A in simplified mode and Article B in original mode.

### Automated Testing
- Update `src/App.test.jsx` or related tests if they mock the playlist structure or verify mode transitions.
