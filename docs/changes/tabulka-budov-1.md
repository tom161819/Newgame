# Building table values (owner, 9 Nov 2026)

## What and why
The owner edited the exported building table (MK_v_85_buildingsv2.xlsx) and asked to apply the worker and production changes on top of 0.90.0.

## Files and systems
src/data/workplaces.js (capacity 1 for lumberjack_hut, hunting_lodge, fisherman_hut, bakery, bowyer, stables, wheelwright_workshop, swordsmith, armorer, pitch_kiln), src/data/economy.js (wage 2 bowyer/swordsmith/armorer), src/data/farming.js (wheat 10, apple 8), src/data/foodProduction.js (mill 4→2, bakery 1→6), src/data/objects/buildings.js (barracks kit 30); tests and texts that encoded the old numbers.

## Implementation decisions
Barracks workers stay at 5: the owner's 12 belongs to the not-yet-ordered Recruit feature (WIP kept in git stash "WIP balance+recruits").

## Save/Load impact
None; SAVE_VERSION 61. Saves keep extra workers until they leave.

## Testing
npm test 1247/1247; browser smokes listed in the release.

## Notes for the next agent
Recruit (Branec) barracks rework is in the stash, not applied.
