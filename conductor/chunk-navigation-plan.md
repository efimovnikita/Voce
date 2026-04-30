# Implementation Plan - Chunk Navigation & UI Cleanup

Add "Previous Chunk" and "Next Chunk" buttons for granular navigation within an article, and remove the "Rewind 10 seconds" button to simplify the interface.

## Proposed Changes

### 1. `src/App.jsx`
- **State Management**:
    - Add `const [currentChunkIndex, setCurrentChunkIndex] = useState(0);`
- **Navigation Handlers**:
    - Implement `handlePreviousChunk` and `handleNextChunk`:
        - Decrement/Increment `currentChunkIndexRef.current`.
        - Stop current audio (`audioRef.current.pause()`, `audioRef.current.src = ''`).
        - Revoke object URLs.
        - Call `playNextChunk()`.
    - **Remove** `handleRewind`.
- **Syncing State**:
    - Update `setCurrentChunkIndex` in `playNextChunk` and `processAndPlay`.
- **Player Component**:
    - Pass new props: `onPreviousChunk`, `onNextChunk`, `hasPreviousChunk`, `hasNextChunk`.
    - **Remove** `onRewind` prop.

### 2. `src/components/Player.jsx`
- **Props**:
    - Add `onPreviousChunk`, `onNextChunk`, `hasPreviousChunk`, `hasNextChunk`.
    - **Remove** `onRewind`.
- **UI Changes**:
    - **Remove** the "Rewind 10 seconds" button.
    - **Add** "Previous Chunk" and "Next Chunk" buttons.
    - Order: [Prev Track] [Prev Chunk] [Play/Pause] [Next Chunk] [Next Track] [Speed].
    - Use single-triangle icons for chunk navigation.

## Verification Plan

### Manual Testing
- Load an article.
- Verify "Rewind 10 seconds" button is gone.
- Verify new "Previous part" and "Next part" buttons are present.
- Test jumping between chunks using the new buttons.
- Verify that buttons are correctly enabled/disabled based on current position.
