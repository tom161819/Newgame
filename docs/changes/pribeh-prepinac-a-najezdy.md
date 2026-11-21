# Story: a New Game switch and raids sized by the player's army

## What and why
Follow-up to the story (0.150.0, 0.151.0), found when checking it in the browser. The owner said to go on as I see fit.

1. **Smoke scripts.** About 70 scripts in `scripts/` start a New Game. The story pauses the game with the prologue, then sends orders, saboteurs and raids. That would break them.
2. **Old saves.** A save from before the story got the court in the middle of a game.
3. **Raid sizes.** Raids used a share of the punitive expedition for the Castle level. At Castle level 3 that was 16 men, right when the Barracks unlock and the player has 4 soldiers.

## Files and systems
- `src/systems/GameSettings.js`: setting `story` (default false; `NEW_GAME_DEFAULTS` true).
- `index.html`, `src/ui/NewGameSetup.js`: switch `#setup-story` in Advanced Settings. It is ticked by default, except in a browser driven by a script (`navigator.webdriver`); a script that wants the story ticks it.
- `src/systems/CourtSystem.js`, `StorySystem.js`: on only with the setting, or when the save carries their state (saves made in 0.150.0–0.151.0).
- `src/data/story.js`: `raidUnits(kind, ours, level)` – our soldiers × factor + a few men, at least 3; archers, swordsmen and knights by Castle level. `raidQuietDays` 5.
- `tests/story.test.js`, `tests/court.test.js`, `tests/world-configuration.test.js`.

## Implementation decisions
- The punitive expedition of the court is unchanged (the owner asked for a large army).
- The webdriver default is the only test-specific behaviour, and it only changes a default of a visible switch.

## Save/Load impact
SAVE_VERSION unchanged. Saved settings gain `story` (missing = false).

## Testing
- `npm test`.
- Browser: a full scripted run through the UI to an ending on two sides (Crown: accused Smil, ending "Lord of both lands"; own lord with landfrýd: "The league's judgment"); 100 game days with snapshots after every half day (all valid).

## Notes for the next agent
A browser script that needs the story: `document.querySelector('#setup-story').checked=true` before `#start-game`.
