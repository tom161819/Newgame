# Marking trees, bushes and rocks; walls over obstacles (m-oznacovani-tezby)

## What and why
Owner requests 51 and 56: mark trees and bushes for removal like rock outcrops, and plan walls straight through forest and rocks without clearing by hand first.

## Files and systems
- `src/data/rockMining.js`: `CLEARING` values (bush 3 s, sapling 5 s, obstacle-clearing building types, 10 s loan cooldown), `clearsObstacles(definition)`.
- `src/systems/RockMiningWork.js`: tree/bush marks (`id → {id,planId}`), plan marking/unmarking, obstruction check, lending/returning a miner.
- `src/systems/ForestryWork.js`: marked trees/bushes first, anywhere on the map; `clearMark` task (no yield) for bushes and saplings.
- `src/systems/ConstructionSystem.js`: marks a plan's obstacles; an obstructed site cannot be built; finish/cancel removes the plan's own marks.
- `src/systems/MineralSystem.js`: wall/tower/gate may be placed over rock and trees.
- `src/ui/RockMiningTool.js`: per-tile marking of rocks, trees, bushes; faint marks outside marking mode.
- Save/validation: `RockMiningState.js`, `GameStateSerializer.js`, `GameStateLoader.js`, `FoodStateValidation.js`.

## Implementation decisions
- A marked sapling becomes a stump without wood; a felled tree loses its mark.
- Bushes are walkable, so they do not block building; bushes left under a finished wall are removed.
- Haulers may deliver to an obstructed site; builders wait.
- Unmark cannot remove marks under an unfinished plan (the site would be blocked forever); cancel the plan instead.
- A lent miner keeps his workplace with a saved `clearingLoan: true`; at most one at a time, only when no free miner exists.
- No separate woodcutter loan: marked targets are open to every woodcutter and come first.
- Wood of a tree under a building drops where the woodcutter stands.

## Save/Load impact
Optional `naturalResources.rockMining.marks`, `planId` on rock records, `clearingLoan` on workers, task `clearMark`. SAVE_VERSION stays 58.

## Testing
`tests/clearing-marks.test.js` (6 tests), all 1026 pass; `scripts/marking-smoke.mjs` (`--marking`), rock-mining and forestry smokes pass.

## Notes for the next agent
An idle builder standing on a stone drop can block a pickup (older behaviour, more likely next to walls) – worth its own fix.
