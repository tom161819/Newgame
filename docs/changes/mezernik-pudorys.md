# Space flattens the buildings to their ground plans (owner point 84)

## What and why
Owner, 19 Nov 2026 (his second point 83): Space should flatten the buildings so only their ground plans show; then what stands behind a building can be clicked, and placing new buildings is clearer.

## Files and systems
- New `src/game/FlatBuildings.js` — `FlatBuildings.toggle()` and `update()`: one Graphics layer (depth -55, above the ground and the fog layer, below units) with the tiles of every known building: finished brown, blueprints and sites light gold, enemy ones red. Redrawn only when a building changes.
- `src/game/GameScene.js` — creates it; building views stay hidden while it is on; `towerAtPoint` then finds a building by its tiles only (its picture no longer catches the click).
- `src/game/MapMemoryRenderer.js` — remembered buildings in fog hide too.
- `src/game/WorldCamera.js` — Space toggles the flat view; the camera's "back to the King" moved from Space to C (the 🎯 button stays).
- `src/i18n/en.js`, `cs.js` — `flat.on/off`, the camera hints name C and Space.

## Implementation decisions
- A toggle, not hold-to-flatten: while building you keep it on and place several buildings.
- Only a look: nothing is saved, and units, trees, piles and icons stay as they are.

## Save/Load impact
None.

## Testing
New `tests/flat-buildings.test.js`. Browser: Space hides the building pictures and shows their plans, the status says how to bring them back, Space again shows them.

## Notes for the next agent
If the owner misses Space for the camera, C is the new key (`WorldCamera.recenter`).
