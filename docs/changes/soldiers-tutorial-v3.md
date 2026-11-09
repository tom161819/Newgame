# Soldiers you can find and train, tutorial v3 (m-vojaci-chyba, m-tutorial-v3)

## What and why

Owner point 87 said soldiers could not be trained, and the ones in the population could not be found. Owner points 74–76 and an owner comment covered three tutorial problems: the arrow lay on top of the Population tab, the Granary step seemed to be missing, and the House step waited for the finished building.

Causes found, reproduced in a fresh 0.80.0 game in a browser:

- **Soldiers could not be found.** The day/night cycle makes soldiers sleep in the first third of the day, because they keep the night watch. A new game starts at the dawn of day 1. So the starting garrison (2 Soldiers and 2 Archers) walked into the Castle at once and slept there hidden (`sleepingIn`, sprite hidden). The probe showed all four as "Going Home" or "Resting" right after the start. They were in the Population list, but only as ordinary rows among the residents, with no group.
- **Soldiers could not be trained.** The Barracks is unlocked at the start (no `requiresCompletedBuildings`). But `MilitarySystem.blocker()` checked only the job, the Combat level and the Gold. It never checked for an Armory or for the unit's item in it. So "Train Soldier" was enabled and took the Gold, and the order then sat on "waiting for Sword from the Armory" forever. A Sword needs an Armory and a Swordsmith (3 Iron + 2 Wood), and Iron needs a Smelter. A new game has no Iron Ore. Nothing on screen said what was missing.
- **The arrow lay over the Population tab (74).** `tutorialPlacement()` treated a target as off screen when its centre was within 28 px of the screen edge. The Population tab hugs the right edge (its centre is about 25 px from the edge), so it counted as off screen. The arrow was then drawn on the clamped point, right over the tab. Measured before the fix: arrow 1877–1907 px, tab 1878–1912 px at 1920×1080, and the same at 1366×768. A second problem: the placement assumed a 34 px arrow, but the UI-design pointers are 40–56 px and pulse to 112 %.
- **Granary step (75).** I could not reproduce a skip in 0.80.0. The order is King, Builder, Hauler, Granary, Lumberjack Hut. A browser walk with auto-employment on also shows the Granary as step 4. The step checks only the building type `granary`, so the Castle and the Starter Stockpile never complete it. The order is now locked by a test, and other stores (Farmhouse, Warehouse) are tested not to complete it either.
- **The House waited for completion (76).** The House step was the only `check:'built'` step.

## Files and systems

- `src/systems/DailyRest.js`: `isSoldierRestTime` is false on day 1, because no night watch has been stood yet.
- `src/systems/MilitarySystem.js`: new `supplyBlocker(type)` returns, in order of checks: horse, `armory`, `kit`, gold. New `kitShortage(type)` gives the items an Armory cannot give now: free stock minus what waiting orders still need. `blocker()` uses both.
- `src/ui/militaryPanel.js`: new `militaryBlockedText()`. Each unit card shows a red reason line (`.unit-type-blocked`). Each recruit row shows `.military-reason`, for example "Soldier: Needs 1 Sword in an Armory. Swordsmith makes Sword from 3 Iron + 2 Wood." The button title carries the same text, and the panel signature now includes the blockers.
- `src/ui/PopulationSidebar.js`: a "Soldiers · N" group (`#population-soldiers`, folding, open). It sits under the needs line and lists every Soldier (garrison included) with unit type and state, for example "asleep in the Castle". A click runs `locateResident`, which centres the camera on the soldier, or on the building he sleeps in.
- `src/systems/Tutorial.js`: `tutorialPlacement()` has a new `arrowLength` parameter. A target counts as off screen only when no part of its rect is on screen. The rect is clipped to the viewport, and arrows above or below a target are kept inside the screen.
- `src/ui/TutorialGuide.js`: `arrowLength()` reads the pointer's CSS width × 1.12 (the pulse). Placement is recomputed on window `resize` and on `transitionend` of the tutorial windows (panels opening or closing).
- `src/data/tutorial.js`: the House step uses `check:'planned'`, so no step waits for a finished building. The Granary note is in a comment.
- i18n en/cs: `military.blocked.armory`, `military.blocked.kit`, `military.make`, `military.reason`, `population.soldiers`, `population.soldierAsleep`.
- `src/style.css`: styles for the reason lines and the Soldiers group (the list is capped at 86 px and scrolls).
- Tests: `tests/tutorial.test.js` (3 new tests, house test updated), `tests/military-units.test.js` (1 new test, the "without items" test updated), `tests/day-night.test.js`, `tests/workplace-staffing-output.test.js` (the fixture now has an Armory with a Sword).
- Smokes: new `scripts/soldiers-smoke.mjs` (`--soldiers`) and `scripts/tutorial-v3-smoke.mjs` (`--tutorial-v3`), both registered in `scripts/browser-smoke.mjs`.

## Implementation decisions

- **Train is blocked, not queued, while the item is missing.** A disabled button with a written reason is what the owner asked for. Queuing for an item that may never exist was the bug. Gold is no longer taken for an order that cannot be supplied. A second order cannot claim an item already promised to an earlier waiting order (`kitShortage` subtracts `missing()` across all Barracks).
- **The garrison stays awake on day 1** instead of starting the game later in the day. Time of day at the start and all other sleep rules are unchanged. From day 2 the soldiers sleep in the morning as before.
- **The Soldiers group is a separate section, not a re-sort of the virtual list.** The existing sorting, filters and Population smokes stay as they are.
- **Garrison units stay outside any Barracks.** They are already trained (`garrison:true`). Training applies to residents employed in a Barracks.
- **No tutorial texts changed.** None of them said "wait until it is finished".

## Save/Load impact

None. SAVE_VERSION stays at 60. No saved field was added or changed: `sleepingIn` and `restPhase` are runtime state, the blockers are computed, and the Soldiers group is UI only. A 0.79/0.80 save with a waiting order (`state:'supplying'`) still loads and finishes when the item arrives. The new rule only blocks new orders. `--save-transfer` passes.

## Testing

- `npm test`: 1152/1152 pass (4 new tests).
- `npm run build -- --base=/Newgame/`: OK.
- Browser smokes, each run alone with `--current-only`, all PASS: `--soldiers` (new), `--tutorial-v3` (new, 1920×1080 and 1366×768), `--tutorial`, `--population`, `--start-v2`, `--e1`, `--military`, `--save-transfer`.
- Screenshots checked by eye: `/tmp/shots/tutorial-v3-1920x1080.png` and `/tmp/shots/tutorial-v3-1366x768.png` show the arrow beside the Population tab, pointing at it. `/tmp/shots/soldiers.png` shows the Soldiers group.

## Notes for the next agent

- `--stables` was not run. The Knight now also needs an Armory and its Sword and Armor in stock before Train is enabled. `tests/stables.test.js` passes.
- If the owner still sees the Granary step missing, ask for the exact version, the start settings, and whether Skip was used. The 0.80.0 code always shows it as step 4.
- If auto-employment is on, it staffs a new Barracks with residents. In the soldiers smoke that gave 9 soldiers.
- A new pointer style must set its `width` in CSS. The tutorial reads that width to keep the pointer off the target.
