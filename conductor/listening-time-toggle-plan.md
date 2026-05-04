# Listening Time Toggle Plan

## Objective
Enhance the listening time indicator to allow users to toggle between viewing their listening time for "Today" and the "Current Week" by clicking on it.

## Key Files & Context
- `src/App.jsx`: Manages the timer state, `localStorage` synchronization, and renders the footer timer UI.

## Implementation Steps

1. **Add New States (`src/App.jsx`)**
   - Introduce `weeklyListeningTime` (integer) to track the current week's total seconds.
   - Introduce `listeningTimeMode` (string, default `'today'`) to track the currently displayed mode ('today' or 'week').

2. **Update Storage and Initialization Strategy (`src/App.jsx`)**
   - Change the initialization `useEffect` to use a new `localStorage` key: `voce_listening_stats`. This will store a JSON object mapping dates (`YYYY-MM-DD`) to total listening seconds.
   - **Migration:** If the old `voce_listening_date` and `voce_listening_time` keys exist, migrate their values into the new `voce_listening_stats` object and delete the old keys.
   - **Daily Calculation:** Set `dailyListeningTime` by reading the value for today's date from the stats object (default to 0).
   - **Weekly Calculation:** Iterate through the `voce_listening_stats` object, filter for dates that fall within the current calendar week (Monday to Sunday), and sum their values to set `weeklyListeningTime`.

3. **Update Timer Interval (`src/App.jsx`)**
   - In the timer `useEffect`, when `isPlaying` is true, increment both `dailyListeningTime` and `weeklyListeningTime` by 1 every second.
   - Continuously update the current day's value in the `voce_listening_stats` JSON object and save it back to `localStorage` to ensure no data is lost.

4. **Update UI (`src/App.jsx`)**
   - Wrap the `<footer>` timer elements in a clickable container.
   - Add an `onClick` handler to toggle `listeningTimeMode` between `'today'` and `'week'`.
   - Update the label to dynamically display either "Tempo di oggi" or "Tempo della settimana" based on the state.
   - Ensure the digital timer displays the correct value (`dailyListeningTime` or `weeklyListeningTime`).
   - Add appropriate CSS classes for hover/active states to indicate interactivity (`cursor-pointer`, `group-hover:text-blue-400`, `group-active:scale-95`).

## Verification & Testing
- Start playing audio and verify both daily and weekly timers increment.
- Click the timer and verify it toggles between the two modes, updating the label and the displayed time correctly.
- Reload the page and ensure the values persist correctly from `localStorage`.
- Manually edit `localStorage` to simulate past days in the current week to verify the weekly calculation logic works correctly.