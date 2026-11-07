# Run in Background and catch-up (#60, S15 / 29B, 7 Nov 2026)

## What and why
The last stage of the original plan (plan item `m-60-simulace-na-pozadi`, spec `docs/upgrades/15_29B_background_simulation.md`). Browsers stop drawing hidden tabs, so the game cannot really run there. With the new setting **Run in Background** (Settings, default OFF), the time the tab was hidden is caught up when the player returns:
- at most 15 minutes per absence;
- with the same simulation step as normal frames;
- behind an "Updating kingdom…" overlay;
- followed by a "While you were away" summary built from real changes.

With the setting OFF, a hidden tab pauses the game exactly as before.

## Files and systems
- `src/data/backgroundSimulation.js`: `BACKGROUND_SIMULATION` (15 min cap, 100 ms step, 25 ms of work per frame, sight refresh every 5 steps, report thresholds).
- `src/systems/BackgroundSimulation.js`:
  - the manager: `hide()` / `show()` measure the absence with `performance.now()`;
  - `step()` runs a batch of `scene.simulationStep()` (or `tick()` in tests) per frame;
  - `runAll()`, `finish()`, `report()` and a snapshot of saved quantities;
  - it records event-feed messages during the catch-up.
- `src/game/GameScene.js`:
  - `update()` is split: `simulationStep(delta)` is the single authoritative step (time, units, combat, construction, farming, production, caravans, trade, regeneration, food, spawners). `update()` adds drawing and HUD.
  - During a catch-up, `update()` runs `background.step()` and draws once per frame.
  - The Phaser PAUSE/RESUME handlers (Page Visibility) call `hide()` / `show()`.
  - `observeWorld()` refreshes sight and the explored-map memory between steps.
- `src/ui/BackgroundSimulationUI.js`: the overlay (progress, cannot be dismissed) and the summary dialog:
  - time elapsed;
  - the part that was not simulated;
  - stock changes;
  - buildings completed;
  - villagers arrived or left;
  - events.
- `src/ui/SettingsPanel.js`, `index.html`, `src/style.css`, i18n en/cs: the switch with its tooltip and hint. `runInBackground` is stored in `localStorage`.
- `src/systems/GameStateSerializer.js`: `runInBackground` is left out of saves, like the brightness.
- Tests:
  - `tests/background-simulation.test.js` (8);
  - the settings test now expects the new field.
  - `scripts/background-smoke.mjs` (`--background`) runs a hidden tab via the real Page Visibility event in Chrome, with a controllable clock for the absence.

## Implementation decisions
- **No second clock, no fake background loop.**
  - The manager only measures the absence. The missed time is fed to the same `GameTimeSystem` through the same step function as normal frames.
  - No timers run in the hidden tab; browsers throttle them anyway. This is what the spec asks for: no pretending to run continuously.
- **Step size.**
  - Catch-up uses 100 ms steps. Normal frames already pass the raw frame time (`rawDelta`), so a slow 100 ms frame is ordinary and every system handles it.
  - The comparison test runs two games with the same seed: one in the foreground with 100 ms frames, one caught up after a 5-minute hidden tab. Time, inventory, workers, buildings, trade orders and the caravan come out identical.
  - Foreground play at 16 ms frames is not bit-identical to 100 ms steps (movement and wander timers integrate per step). That is the same difference as between a fast and a slow computer today, not a catch-up shortcut.
- **Responsiveness.** At least one step and then up to 25 ms of steps per frame. In the smoke, 6 minutes of game time for a fresh kingdom catch up in about 1.5 s. The overlay shows progress, and input is blocked until it ends.
- **When nothing is caught up.**
  - The player had paused (the menu or the Settings panel).
  - Game Over: the catch-up also stops the moment the King falls, and the Game Over dialog takes over.
  - The setting is off.
  - A game was closed and loaded again: the manager belongs to the open session and starts empty.
  - A pause during the catch-up holds it until the pause ends.
- **Counting time once.**
  - Repeated hide events keep the first checkpoint, and `show()` clears it.
  - A second absence during a running catch-up joins the same session, and the 15-minute cap covers the whole session.
  - A clock going backwards adds nothing. `performance.now()` ignores system clock changes.
  - After sleep, the cap limits the time.
- **Cap.** Anything over 15 minutes is not simulated. The summary always says how long the player was away, how much was simulated and how much was not, even when less than a day passed.
- **Fog of War.** Sight sources are the same; sight and map memory are refreshed every 5 steps (0.5 s of game time). At the edges of sight this can explore slightly less than per-frame play would, never more, so unexplored areas are never revealed by the catch-up itself.
- **Summary.**
  - Shown when at least one game day passed, or when part of the absence was not simulated.
  - Stock changes are differences of inventory counts before and after.
  - Buildings are counted with `buildingIsComplete`, and population is the live worker count.
  - Events are the event-feed messages pushed during the catch-up, important ones first.
- **Setting scope.** The setting belongs to the browser: `localStorage`, never in a save, default OFF for every existing save.

## Save/Load impact
None to the schema (`SAVE_VERSION` stays 49). Saves never contain `runInBackground`, and loading a save never simulates the time the game was closed.

## Testing
- `npm test` passes (894).
- `npm run smoke -- --current-only --background` passes (OFF pauses; ON catches up 3 game days, then the summary and normal play).
- `--marketplace` passes.
- Summary screenshot checked.

## Notes for the next agent
- Any new time-based system must be updated inside `GameScene.simulationStep()`, not in `update()`, or it will not run during a catch-up. HUD and drawing go in `update()` or `refreshVisibility()`.
- Tune the cap, step and frame budget only in `BACKGROUND_SIMULATION`.
- An offline progress system (time while the game was closed) is out of scope by the spec and was not built.
