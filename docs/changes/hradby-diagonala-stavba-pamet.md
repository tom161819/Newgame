# Diagonal walls: construction sites and the remembered map

## What and why
Handover 19 Nov 2026 (`claude/predavka-mechaniky-2026-11-19.md`, known gaps of m-hradby-diagonala from 0.146.20): a diagonal wall under construction was drawn as a row of blocks, and the remembered map under the Fog of War forgot the diagonal pieces (it remembered only the links, so a remembered diagonal wall showed blocks).

## Files and systems
- `src/game/walls.js`: `wallLayout(buildings)` – links and shape of every wall tile. Finished walls take both from finished walls only (the wall walk is unchanged); a wall under construction takes its shape from the whole planned line (finished and unfinished walls).
- `src/game/GameScene.js` `refreshWallConnections` uses it and now also refreshes construction sites (before only finished walls).
- `src/game/mapMemoryObjects.js`: a remembered wall stores `diagonal` / `elbow` next to `connections`; `MapMemoryRenderer` spreads the visual into the building, so `FortificationView` paints the piece.
- `src/systems/MapMemoryValidation.js`: accepts `diagonal` (`se`/`ne`) and `elbow` (`<corner>-<two bits>`), only on a Stone Wall.
- Test: `tests/diagonal-walls-sites.test.js`.

## Implementation decisions
- A finished wall at the end of a half-built diagonal line keeps the elbow of the finished part until its neighbour is finished; walls on the wall walk must not lead to unfinished walls.
- Rejected elbows still draw as blocks (unchanged).

## Save/Load impact
Two new optional fields in the remembered map (`exploration.objects[].visual.diagonal` / `elbow`). Older saves load unchanged; SAVE_VERSION stays 66. A save made now does not load in 0.147.0 or older if it remembers a diagonal wall.

## Testing
- `tests/diagonal-walls-sites.test.js`, `tests/walls.test.js`, `tests/diagonal-walls-art.test.js`, full suite.
- Browser (Test map): a diagonal line of 7 walls; with the middle three turned into sites the sites keep `se` and the finished ends become elbows. The look of a real construction site was not checked (the Test map builds at once).

## Notes for the next agent
- Wall placement previews (blueprint ghosts while dragging) are not changed here.
