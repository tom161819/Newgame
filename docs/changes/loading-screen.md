# Loading screen when a game starts (owner point 74)

## What and why
Owner, 19 Nov 2026: when the game starts (new game or loading) the window opens and the assets then show one by one; a loading screen should stay until everything is loaded.
The game fetches building, unit and ground pictures when their views first ask for them, so the first seconds showed the map filling in.

## Files and systems
- New `src/ui/LoadingScreen.js` — `LoadingScreen` (full-window title, text and a progress bar from Phaser's loader counts) and `sceneSettled(scene)` (the loader is not loading and has nothing queued or in flight). It hides once the loader has been quiet for 500 ms (at least 400 ms after the start, at most 15 s).
- `src/ui/GameApplication.js` — `start()` shows it (new game, loaded save, the Test map, a zone and the way home all go through it); `onGameReady` hands it the scene.
- `src/style.css` — `.loading-screen`, `.loading-bar`.
- `src/i18n/en.js`, `cs.js` — `loading.text`.

## Implementation decisions
- The time limit keeps the game from staying hidden when a picture never arrives.
- The screen lets clicks through (`pointer-events:none`), so the browser smokes and automation are not blocked; the game behind it is already running as before.
- The ground's slow repaint of chunks outside the view is not waited for (it never ends while chunks are off screen).

## Save/Load impact
None.

## Testing
New `tests/loading-screen.test.js`. Browser: the Test map start shows the screen for about 9 s in the headless browser and opens on a fully drawn view. `browser-smoke --world-code` stops at the same known place as before (line 362, the King's stone).

## Notes for the next agent
The limits are in `LOADING`.
