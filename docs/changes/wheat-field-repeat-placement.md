# Wheat Field keeps its tool after placing (owner bug, 7 Nov 2026)

## What and why
The owner reported that the Orchard tool stays active after placing a blueprint, while the Wheat Field tool closes and the building has to be chosen again. The cause was a hard-coded list `['farmhouse','orchard']` in `GameScene` (from 0.4.0) that missed `wheat_field`. The task is tracked on the plan page as `m-bug-wheat-farm-opakovana-stavba`.

## Files and systems
- `src/data/objects/farming.js`: `repeatPlacement: true` on Farmhouse, Wheat Field and Orchard.
- `src/game/GameScene.js`: keeps the tool when `selectedBuilding.repeatPlacement` is set, instead of checking the id list.
- `src/systems/ObjectRegistry.js`: `repeatPlacement` must be a boolean on a building.
- Tests: `building-categories` (exactly these three repeat; invalid value rejected). `scripts/repeat-placement-smoke.mjs` places two Wheat Fields in a row without the menu, then Escape ends the tool.

## Implementation decisions
- A data flag rather than a longer id list, so a future building can opt in without touching the scene.
- Buildings reviewed: Farmhouse, Wheat Field and Orchard (fields and farms) now behave the same. Everything else stays single placement, as before. Walls and Stone Pavement have their own line and area tools; the Tower, Castle, workshops and House are placed once. The smoke still checks that the Tower ends the tool.
- Running out of materials behaves like the Orchard: the failed order shows the error and the tool stays open.

## Save/Load impact
None.

## Testing
`npm test` passes (788). `npm run smoke -- --current-only --repeat-placement` passes.

## Notes for the next agent
- To let another building keep its tool after placing, set `repeatPlacement: true` in its definition and extend the test in `tests/building-categories.test.js`.
- Without GitHub, `npm run version:check` compares with the stale `origin/main` from the backup (0.8.1). Run it per commit as `npm run version:check -- --base=HEAD^1`, as CI did.
