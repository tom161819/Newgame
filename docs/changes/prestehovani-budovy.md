# Move a building (0.140.0)

## What and why
Owner 15 Nov 2026 (59): add "Move" to a building for 50 % of the materials of a new one; the blueprint goes elsewhere and may overlap the building being moved; a Builder dismantles the building and builds it at the new place.

## Files and systems
- `src/game/relocation.js` (new): `relocationCost`, `relocationDefinition` (half price, booked by the site like the free Lumberjack Hut), `canRelocate`, `relocationError` (the moved building's tiles count as free), `orderRelocation`, `completeRelocation`, `cancelRelocation`.
- `src/data/demolition.js`: no refund for a building with `relocation`. `src/systems/DemolitionSystem.js`: cancelling the dismantling cancels the move (and its site).
- `src/game/GameScene.js`: `startRelocation`, preview and click in build mode; the demolition completion places a deferred site.
- `src/ui/DemolitionUI.js`: Move button and note; attached also in the Village (houses, green) and Marketplace windows.
- Serializer: `building.relocation` {x, y, siteId?} validated; **SAVE_VERSION 64**. i18n `relocation.*`.

## Implementation decisions
- Without overlap the new site is placed at once (Builders may build it while others dismantle); with overlap it is placed when the old building is gone, so two buildings never share tiles. If that placement fails then (no materials any more), the status says why and nothing is paid.
- Not movable: Castle, Starter Stockpile, walls, towers, gates, fields, ruins, pavement.

## Save/Load impact
SAVE_VERSION 63 → 64. The test fixture save moved to 64.

## Testing
tests/relocation.test.js (cost, refusals, beside: immediate half-price site, no refund, save validation, both built; over: deferred site, cancel). Browser: the Move button in building windows, the placement mode accepts a plan over the building.

## Notes for the next agent
Workers employed in the old building lose their place at the dismantling; automatic employment fills the new one.
