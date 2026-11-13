# GPT farmstead; Farmhouse 4 × 4

## What and why
Owner, 13 Nov 2026: new GPT farmstead (fenced, paved yard). At the shared door scale (doors ≈ 48 px) the yard is ≈ 270 px wide, more than the 3 × 3 footprint (192 px). The owner chose to enlarge the footprint to 4 × 4 (also allowed: removing it from older saves if integration were a problem — not needed).

## Files and systems
- `art/assets/buildings/farmstead/asset.json` (footprint 4 × 4), `art/sprites/farmstead/farmstead-gpt-{0,90,180,270}.v1.*` (scale 0.457, torch light at the door), `art/approvals.json` (0° approved on the owner's chat decision, preferred).
- `src/data/objects/farming.js`: Farmhouse 4 × 4 with `legacyFootprint: {width: 3, height: 3}`.
- `src/data/objects/approvedArt.js`: farmhouse art + `legacyVisual` (display size at 3/4).
- `src/game/buildings.js`: `legacyDefinition`, `withFootprint`, `definitionFor`, `buildingDefinition`; `placeBuilding` sets `size`.
- `src/systems/GameStateSerializer.js`: saves `size` for every non-legacy Farmhouse; validation reads each building's footprint through `withFootprint` (`bdef`).
- `GameStateLoader`, `FoodStateValidation`, `RockMiningState`, `NightThreatSystem`, `HeatingSystem`, `WorkplaceSystem`, `pavement`, `mapMemoryObjects`, `MapMemoryValidation`, `Minimap`, `ArmyPanel`, `militaryPanel`, `GameScene`: building geometry through `definitionFor`.
- Tests: `tests/farmhouse-4x4.test.js`; positions adjusted in `farming`, `resource-ledger-integration`, `logistics-haulers` tests; `asset-studio-buildings` footprint 4 × 4.
- `scripts/gpt-sprite-grade.py`: optional iteration count (12 for the farmstead so the paved yard stays).

## Implementation decisions
- Old saves have no marker, so the marker is on the new size: a Farmhouse with `size: 4` is 4 × 4, one without is 3 × 3 (legacy definition: same id, footprint 3 × 3, art at 3/4, lights and shadow scaled).
- `definitionFor(building, registry)`: footprint from the live building, everything else from the registry (workplace capacities can change at runtime).
- Map memory accepts a remembered Farmhouse at its legacy size.

## Save/Load impact
SAVE_VERSION stays 62. New optional `buildings[].size` (only Farmhouse, value 4). Older saves load; their Farmhouses stay 3 × 3.

## Testing
Full `npm test` (1307 pass), `npm run studio:smoke`, screenshot of the farmstead next to the houses.

## Notes for the next agent
Another footprint change can reuse `legacyFootprint` + `legacyVisual`.
