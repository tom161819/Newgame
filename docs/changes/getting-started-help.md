# Getting started help behind the HUD "?" (owner task, 7 Nov 2026)

## What and why
The owner asked for a help button at the top right that guides the start of a game through the first buildings ("Začátek hry → postav skladiště", steps proposed by Claude and approved: start of the game and the first buildings only). Tracked on the plan page as `m-napoveda-zacatek-hry`. Follows 0.9.2 (Castle and resources at the start) and #132 (Granary before the Hunting Lodge).

## Files and systems
- `src/data/gettingStarted.js`: `GETTING_STARTED_STEPS` – `id` and `buildingId` per step, in order: Warehouse, Granary, Farmhouse, Hunting Lodge, Wheat Field, House, Lumberjack Hut.
- `src/systems/GettingStarted.js`: `gettingStartedProgress(buildings)` (done = a completed building of that type; first missing step is current) and `gettingStartedProblems(registry)` (unknown building, a step needing a later building, duplicates).
- `src/ui/GettingStartedPanel.js`: the `#help-toggle` button (dot = `has-alert` until all done, title with progress) and the modal `#help-dialog`; refreshes on `buildings:changed`; a step closes the panel and opens the Buildings menu on the building's category with its button focused. Closes with Close, Esc, a click on the backdrop and a right click (`help-dialog` in `DISMISSIBLE_PANELS`).
- `src/ui/GameApplication.js`: `start()` without a state sets `pendingGettingStarted`; `onGameReady` opens the panel once.
- `src/game/GameScene.js`: creates, relabels and destroys the panel. `index.html`, `src/style.css`, i18n `help.*` (en, cs).
- Tests: `tests/getting-started.test.js`; `scripts/getting-started-smoke.mjs` (`--getting-started`, also in `--full`) in its own page; `scripts/browser-smoke.mjs` closes the panel after its New Game; `scripts/profile-current-game.mjs` closes it before profiling.

## Implementation decisions
- Progress is derived from the world, not saved: no save format change, and old saves show standing buildings as done.
- Auto-open only for a New Game started from the setup (not Load, not Restart after Game Over), so scenarios that restart the scene in code are unaffected.
- The texts are i18n keys (the game UI is English by default and has Czech); each "why" matches what the building does in the game now (Warehouse 200 materials, Granary unlocks Farmhouse and Hunting Lodge, House +5 residents…).
- All seven proposed buildings exist, so no step was dropped. The builders' workshop (#118) is to be added when it exists.
- A modal dialog like the other panels: the map waits while it is open.

## Save/Load impact
None.

## Testing
`npm test` passes (805). `npm run smoke -- --current-only --getting-started` passes, as do `--building-unlocks`, `--right-click`, `--i18n` and `--repeat-placement`. `--full` needs the version archive (`public/versions/`), which is not in this working copy; its N04 section was updated for the 160-unit Starter Stockpile from 0.9.2 but could not be run here.

## Notes for the next agent
- A new step: add it to `GETTING_STARTED_STEPS` with `help.step.<id>` and `help.step.<id>.why` in `en.js` and `cs.js`; the unit test checks texts and the order.
- When a smoke starts a New Game through the setup, close Getting started first (Escape or `scene.gettingStarted.close()`), it is modal.
