# m-tutorial-v2 – Tutorial v2 (0.50 playtest, points 1–9)

## What and why

The owner's 0.50 playtest listed nine problems with the arrow tutorial. Before this change, checked against the current code:

- **Already fixed:** nothing in points 1–9. The storage step already pointed at the Material Yard and the Builder's Workshop (0.65.0), and progress was already recomputed from the world every 150 ms on each frame.
- **Bug 6, real cause:** the stone step read `naturalResources.mining.rocks`. `mining` is the Mineral System, which has no rocks. The marks are stored in `naturalResources.miningWork.rocks.records` (RockMiningWork). Marking a rock therefore never ended the step.
- **Bug 7:** the House check itself was correct (`buildingIsComplete`). The House step looked stuck because the stone step in front of it never ended, so the tutorial never got to it. The bug 6 fix solves it. A 500 ms timer is added as a fallback (see below).

The new step order has 15 steps:

1. king
2. builder
3. hauler
4. granary
5. hunting_lodge
6. fisherman (optional)
7. farm (optional)
8. mill (optional)
9. bakery (optional)
10. lumberjack_hut
11. stone
12. miner
13. house
14. storage
15. speed

Other changes:

- The texts were revised in EN and CS. The king's text is new.
- Next to the Population panel, the arrow and the bubble are placed beside the panel instead of over it (point 2).
- Once "Mark to clear" is on, the arrow points down at the rock nearest the Castle (point 5).
- A Castle start now has 5 residents instead of 3, and 90 Wood (points 5 and 8).

## Files and systems

- `src/data/tutorial.js`: the new steps. New fields: `check:'job'` with `job`, and `optional:true`. `TUTORIAL_PATH_BUILDINGS` lists the buildings the mandatory steps ask for.
- `src/systems/Tutorial.js`:
  - `tutorialProgress`: fixed rock lookup, job steps, and the optional-step rules.
  - `markedRocks`.
  - `nearestRock`: pure function.
  - `tutorialPlacement`: pure placement of the arrow and bubble.
- `src/ui/TutorialGuide.js`:
  - Job steps work generically (Population tab → job button → profession in the menu). The panel and the menu are passed as `avoid` rectangles.
  - When the rock tool is on, the stone step targets a world point above the rock and shows the text `tutorial.step.stoneMark`.
  - "Show me" on the stone step turns on the marking tool.
  - Optional steps show a "Next" button.
  - `place()` uses `tutorialPlacement`.
  - A 500 ms interval runs `update()`.
- `src/i18n/en.js`, `src/i18n/cs.js`: all `tutorial.step.*` texts and `tutorial.finished`. New keys: `hauler`, `fisherman`, `mill`, `bakery`, `miner`, `stoneMark`. The farm text takes `{plots}`, which is filled from `FARM_PLOT_CAPACITY` (4).
- `src/systems/GameSettings.js`:
  - `NEW_GAME_DEFAULTS`: Stone 30, Wood 90, Bread 180, total 300.
  - New constant `CASTLE_START_EXTRA_RESIDENTS = 2`.
- `src/systems/WorkerSystem.js`: `spawnInitial` adds the extra residents when `gameSettings.startingCastle` is on.
- `src/ui/NewGameSetup.js`: the Calm preset is now Wood 100, Stone 40, Bread 160, so it still has more wood than Normal.

## Implementation decisions

- **Hauler / Miner:** the game's profession names are Hauler (Nosič) and Miner (Horník). Each step is done when a living resident has that profession. The Miner is a separate step right after stone (the "Choose a miner" sub-step).
- **Optional steps:** an optional step is done when any of these holds:
  - the player pressed Next (session `seen`);
  - its building is planned;
  - any later mandatory *building* step is done in the world.

  The last rule means a loaded or older game never falls back to them. Job steps don't count for this rule, because auto-employment can create a miner early.
- **King can build:** yes. Click a construction site and choose "Build with King" (`construction.kingWork`). This was added to the Lumberjack Hut text.
- **Placement:**
  - The arrow sits outside the union of the target and the `avoid` box. It sits at the target's height, on the side with more room, and points at the target.
  - Targets near the bottom bar get the arrow from above.
  - A narrow screen falls back to above or below.
  - A final check moves the bubble off the target if the screen edge pushed it back over.
- **Start values:**
  - Mandatory path: Granary 12 + Hunting Lodge 8 + Lumberjack Hut 6 + House 10 + Material Yard 20 + Builder's Workshop 20 = 76 Wood. 90 Wood leaves a reserve of 14.
  - The Starter Stockpile holds 300, so Stone went from 40 to 30 and Bread from 200 to 180. No tutorial building costs stone.
  - Residents: 3 + 2 = 5 (Builder, Hauler, Hunter, Miner, plus one spare). With the garrison of 4, that is 9 of 10. The garrison is not counted as free workers.
  - The extra residents depend on `startingCastle`, the normal New Game start. Scenarios and `DEFAULT_GAME_SETTINGS` still start with 3. A different flag is possible later.
- The Challenge preset (40 Wood) is unchanged. It is meant to be harder, and the free Lumberjack Hut rule still applies.

## Save/Load impact

- No `SAVE_VERSION` bump (still 59), and no new saved fields.
- Tutorial progress is not saved. It is recomputed from the world, so an older save resumes at the first mandatory step it hasn't done. For example, a save with a Lumberjack Hut but no Hauler resumes at the Hauler step. Optional steps are passed automatically.
- Very old saves without `workers` call `spawnInitial()` on load. With a Castle in their settings, they now get 5 residents.

## Testing

- `npm test`: 1076/1076 pass. `tests/tutorial.test.js` was rewritten and now covers:
  - the step order;
  - Hauler and Miner as steps;
  - auto-advance after marking a rock (bug 6) and after finishing a House (bug 7);
  - optional steps closed with Next or by building them;
  - the start paying the whole mandatory path and leaving a free Miner within the population maximum;
  - `nearestRock`;
  - `tutorialPlacement` never covering the target or the panel.
- `tests/start-v2.test.js` and `tests/starting-resources.test.js` now expect 30/90/180.
- `npm run build -- --base=/Newgame/` passes.
- Browser smokes were updated but **not run** (they would collide with the other agent):
  - `scripts/tutorial-smoke.mjs`: new flow with job steps, Next on optional steps, and a real click on the rock.
  - `scripts/start-v2-smoke.mjs`: 180 Bread, population 9/10.
  - `scripts/e2-smoke.mjs`: Calm preset wood 100.
  - `scripts/browser-smoke.mjs`: setup defaults 30/90/0/180.

## Notes for the next agent

- Run `scripts/tutorial-smoke.mjs` in a browser first. The new `arrowBeside` check and the rock click (`clickWorld` on the tile centre from `tutorial.rockTile()`) have not been run yet.
- If the owner wants the extra residents tied to something other than the Castle start, change only `WorkerSystem.spawnInitial` and `CASTLE_START_EXTRA_RESIDENTS`.
- The help checklist (`src/data/gettingStarted.js`) was not changed.
