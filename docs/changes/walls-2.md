# Walls 2: repeat placement, gate/tower over a wall, gate rotation, well anywhere (m-staveni-zdi-studna)

## What and why
Owner requests 59 and 61. Building defences was slow: every segment needed reselecting, a gate could not be put into an existing wall and could not be turned. The Well refused paths.

## Files and systems
- `src/data/objects/buildings.js`: `repeatPlacement` on wall/tower/wall_gate; `replacesWall` on tower/wall_gate (validated in ObjectRegistry).
- `src/game/buildings.js`: `wallsReplacedBy`, `placementError` treats replaced wall tiles as the ground under them, `status.wallReplaceKing`; `placeBuilding(…, replaceWalls, fields)` returns `{building,replaced,refund}`. Well skips the path/paving rule.
- `src/game/wallReplacement.js`: removes planned (cancel with refund) and finished (shell removal) segments; demolition-rule refund summed over the replaced segments, spilled beside the new building.
- `src/game/walls.js`: `gateAxis`, `gateAxisLocked`, `turnGate`.
- `src/game/GameScene.js`: R key / preview turning, repeat wall lines, status messages; `src/game/WorldCamera.js`: Shift+wheel turns a gate while placing it.

## Implementation decisions
- Refund = half of the paid cost of all replaced finished segments together (per segment it would always round to 0).
- A Gate over a wall line follows the wall; R only turns a lone Gate.
- The Well still needs a finished House first.
- Cancelled wall refunds that would lie under the new building are moved to the nearest open tile.

## Save/Load impact
Optional `buildings[].gateAxis` ('x'|'y', wall_gate only). SAVE_VERSION stays 58.

## Testing
`tests/walls-2.test.js` (+ updated building-categories, children); 1032 pass. Smokes: walls-2 (new), gate, walls, repeat-placement, decorations, marking, housing, fire, demolition.

## Notes for the next agent
Gates remembered under fog (map memory) do not use the stored axis yet.
