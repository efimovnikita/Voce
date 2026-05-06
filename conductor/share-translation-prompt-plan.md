# Share Translation Prompt Plan

## Objective
Replace the settings-based translation behavior with an interactive prompt that appears immediately when an article is shared to the app. This allows the user to explicitly select the translation language ([Original], [EN], [IT]) on a per-article basis, making the old global settings obsolete.

## Key Files & Context
- `src/App.jsx`: Main entry point where shared URLs are intercepted and processed. Needs to be updated to show the prompt before processing.
- `src/components/Settings.jsx`: Settings panel. Needs to be updated to remove old translation toggles.

## Implementation Steps

### 1. Update Settings (`src/components/Settings.jsx`)
- Remove `useTranslation` and `targetLang` state variables and their `localStorage` handlers.
- Remove the "Use Translation" checkbox UI and the "Target Language" dropdown UI.
- Ensure the "Google Translate API Key" input remains permanently visible in the Settings panel (not hidden behind a toggle).

### 2. Update App Logic (`src/App.jsx`)
- **Add State:** Introduce a new state `sharedContentPending` to temporarily store the shared URL/text.
- **Intercept Share:** Modify the `useEffect` that reads `window.location.search`. Instead of immediately calling `processNewSharedText`, it will set `sharedContentPending` with the decoded text.
- **Render Modal:** Add a compact modal overlay that renders when `sharedContentPending` is not null. 
  - Title: "На какой язык перевести?" (What language to translate to?)
  - Options: `[Original]`, `[EN]`, `[IT]`.
  - Action: Clicking an option triggers the processing function and clears `sharedContentPending`.
- **Refactor Processing:** Modify `processNewSharedText` to accept `targetLang` as an argument (where 'original' or null skips translation). The logic will use the provided language instead of reading from `localStorage`.
- **History Management:** Ensure `window.history.replaceState` is called either when setting the pending content or after the user makes a selection, to prevent duplicate processing on page reloads.

## Verification & Testing
- Open settings and verify that the Google Translate API Key field is visible and the language/toggle settings are gone.
- Simulate sharing a URL (`?url=https://example.com`).
- Verify that the app opens and immediately shows the "На какой язык перевести?" modal.
- Select "Original" and verify the article is processed without translation.
- Select "EN" and verify the article is translated to English (assuming a valid API key).
- Select "IT" and verify the article is translated to Italian.
- Verify that refreshing the page does not re-trigger the modal.