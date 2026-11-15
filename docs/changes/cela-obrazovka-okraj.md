# Full screen and a wider scroll edge

## What and why
Owner, 15 Nov 2026: at the top and bottom the pointer ran into the browser's bars before the view moved – make the edge about 15 px; add full screen to the Settings with a usual shortcut.

## Files and systems
- `src/game/WorldCamera.js`: `EDGE_SCROLL_PX=15`; `fullscreen()`, Alt+Enter, button `#settings-fullscreen` (`index.html`).
- i18n: `settings.fullscreen*`.

## Implementation decisions
- F11 is the browser's own full screen key and cannot be taken over reliably, so the game uses Alt+Enter and a button; F11 keeps working.
- When the page runs in a frame that forbids full screen, the status line says so and suggests F11.

## Save/Load impact
None.

## Testing
- Full suite. Not tried in a browser (full screen cannot be checked headless).

## Notes for the next agent
- None.
