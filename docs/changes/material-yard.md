# m-sklady-materialu-koncept – Material Yard and producer output piles

## What and why
Owner requests 21 and 49: one open storage yard instead of separate Lumber and Stone yards, with goods that visibly grow in it, and output piles by the producers so miners and woodcutters no longer walk to storage. New building **Material Yard** (`material_yard`, 4×2, 20 Wood, no workers, Logistics & Trade) stores only wood, stone, iron ore and iron, 400 units in total. The Warehouse no longer takes these four (it keeps crafted goods such as pitch and torches); the Starter Stockpile is unchanged. Quarry, Iron Mine and Lumberjack Hut drop their output on a pile of 20 by the building; Haulers take it to the nearest Material Yard, or to the Starter Stockpile (any store taking the good) while no yard has room. A full pile stops the producer ("Output pile full", EN + CS).

## Files and systems
- Data: `src/data/logistics.js` (`YARD_RESOURCES`, `yardCapacity` 400, `outputPileCapacity` 20, `OUTPUT_PILES`, `outputPile()`, `pileLocationId()`, `pileStage()`, `stockLocationId` → `yard-<id>`; `accepts:'materials'` now excludes the yard resources), `src/data/objects/logistics.js` (yard definition, `renderer:'material_yard'`, Warehouse text), getting started / royal goal / tutorial now point to the yard, `experience.js` (8 XP for a finished yard).
- Storage: `FoodStorageSystem` registers a `pile-<buildingId>` location (kind `pile`, never a store) and `pileFor()`; the Starter Stockpile can be removed once a Material Yard (not a Warehouse) is finished (reason `yard`). `FoodStateValidation` expects the pile locations and lets `chopTree`/`mineDeposit` target the worker's own pile.
- Producers: `MiningWork`/`ForestryWork` reserve capacity in their own pile (old `findDestination` stays as fallback when no pile exists). `FoodProductionSystem` counts a delivery to the worker's own pile as the producer's delivery (workplace `delivered` stats, deferred rewards). `LogisticsTaskManager` adds pile → store haul tasks (priority 30 to a `storage` kind, 32 to the fallback stockpile).
- Diagnostics/UI: pile stock counts as pending output for "Storage full" (helper building is now the Material Yard for the four goods); new notice `pileNoHauler` (full pile, no Hauler; Hire Hauler action and the orange sign); `transport.pile` label; store gauge and StorePreview include yards and piles.
- Visuals: `src/game/MaterialPiles.js` – `MaterialYardView` (code-drawn fenced packed-earth plot with 4 fields: logs, stone blocks, ore heap, iron bars; 5 sizes) and `MaterialPiles` (redraws only when a size changes; producer piles on the tile in front of the building's front corner). Icon `public/assets/buildings/material_yard/material_yard.svg`. No Phaser import (point-in-polygon inline) so node tests can drive the views.

## Implementation decisions
- Reused the storage-location ledger (like the recipe `output-` buffers) instead of a parallel system; a pile is not `isStock`, so construction, trade and inventory only see goods once a Hauler moved them.
- Producers do not self-haul when there is no Hauler (owner spec): they wait and a `pileNoHauler` notice asks for a Hauler.
- Pile size = ceil(amount / full × 4), capped at 4; a yard field is "full" at a quarter of the yard capacity (100).
- The Marketplace still requires a finished Warehouse (trade building, unchanged).

## Save/Load impact
SAVE_VERSION 58 → 59 (new `pile-*` storage locations and the yard). Older saves are refused per the alpha policy; no migration.

## Testing
`npm test`: 1052 pass (5 new in `tests/material-yard.test.js`: yard accepts only the four goods and the Warehouse refuses them, mine pile → Hauler → yard ahead of the starter store, full pile stops mining + Save/Load + starter fallback, hut pile, pile sizes and redraw-only-on-change). Existing tests that stored wood/stone in a Warehouse or expected direct delivery now use a yard and/or a Hauler with the same intent. Build OK. New smoke `--material-yard` (screenshot `/tmp/shots/material-yard.png`). Full `npm run smoke -- --current-only --keep-going` run in batches; every flag passes alone (fixtures updated in demolition, stockpile-cleanup, storage-window, smelting, storage-notices, mineral and forestry smokes). Failures seen only inside long batches are cascades on the shared main page and pass alone; the main-page building-strip wheel check also fails after any separate-page smoke at baseline (seen with `--ui-windows` on HEAD).

## Notes for the next agent
- No CHANGELOG entry or version bump yet (release is a MINOR because of SAVE_VERSION 59).
- Yard and pile visuals are provisional code drawings; replace with Studio art when approved (keep `setPiles(stages)` and texture keys `material-pile:<resource>:<stage>`).
- Possible follow-ups: let the woodcutter pile sit near the hut's work area, show pile contents in the workplace panel, balance pile/yard capacities.
