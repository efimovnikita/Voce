# Implementation Plan: Google Translate Integration

## Objective
Add the ability to automatically translate imported text (from articles or YouTube transcripts) using the Google Cloud Translation API before saving it to the application's playlist.

## Scope & Impact
- Users will be able to toggle translation on/off in the settings.
- Users can provide their Google Translate API key.
- Users can select a target language: English (`en`), Italian (`it`), or Russian (`ru`).
- The translation occurs during the import phase (in `processNewSharedText`), meaning the final text saved to the database and read by the TTS engine will be the translated text.
- No automated tests will be added, as per user request.

## Key Files & Context
- `src/components/Settings.jsx`: Needs new UI elements for the translation toggle, API key input, and target language dropdown.
- `src/api/translate.js` (New File): Will contain the logic to make HTTP requests to the Google Translation API.
- `src/App.jsx`: Needs to intercept the imported text in the `processNewSharedText` function, apply the translation if enabled, and then proceed with the existing flow.

## Implementation Steps

### 1. Create Translation API Module
Create a new file `src/api/translate.js`.
Implement a `translateText(text, targetLanguage, apiKey)` function.
- It will make a `POST` request to `https://translation.googleapis.com/language/translate/v2`.
- Pass the `q` (text), `target` (targetLanguage), and `key` (apiKey) parameters.
- Parse the response and return the translated string.

### 2. Update Settings UI (`src/components/Settings.jsx`)
- Add state variables for `isTranslationEnabled`, `googleTranslateApiKey`, and `targetTranslationLang`. Initialize them from `localStorage`.
- Add a Toggle/Checkbox for "Use Translation".
- Conditionally render (only if translation is enabled) an input field for "Google Translate API Key".
- Conditionally render (only if translation is enabled) a `<select>` for "Target Language" with options "English" (`en`), "Italian" (`it`), and "Russian" (`ru`).
- Update the `onChange` handlers to save these values back to `localStorage` and trigger `onSettingsChange`.

### 3. Update Import Logic (`src/App.jsx`)
- In the `processNewSharedText` function, after extracting `textToProcess` (either from YouTube or an article) and before creating the `newTrack` object, check if translation is enabled via `localStorage`.
- If `localStorage.getItem('use_google_translation') === 'true'` and an API key is present:
  - Update the status UI to indicate translation is in progress (e.g., `setStatus('Translating text...')`).
  - Call `translateText` with `textToProcess`, the selected target language, and the API key.
  - Overwrite `textToProcess` with the returned translated text.
- Continue the normal execution (saving to database, updating UI, generating title).

## Verification
- Open Settings, enable translation, input the API key, and select Italian.
- Import a text (e.g., an English article URL).
- Verify that the text displayed and read by the application is in Italian.
- Disable translation and verify that the original text is imported without modification.