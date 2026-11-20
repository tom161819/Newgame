# Walls join the Gate and Tower without gaps; one wall-walk door per face

## What and why
Owner 20 Nov 2026 (screenshots): "brána se pořád zobrazuje nad zdí, potřebuju aby se překrývali správně, správně na sebe
navazovali bez mezery, u věže je taky mezera, a dveře tam stačí udělat z věže jedny ne dvoje".

## Files and systems
- `src/data/objects/buildings.js` (wall): `depth.offset` 0 → 0.5. A wall on the back row/column of a Gate or Tower
  face (the tile before the face's far half) has the same sort corner as the 2 × 2 body, and the body won the tie, so
  the Gate was drawn over the wall in front of it. Half a pixel keeps the wall in front; units in front of a wall still
  use `buildingDepth + .05` and stay between its back and front layers.
- `src/game/walls.js` `wallLayout`: each finished wall gets `into` – the sides where it runs into a finished Tower (any
  side) or Gate (its wall sides). `GameScene.refreshWallConnections` stores it as `building.wallInto`.
- `src/game/FortificationView.js`: for every `wallInto` side the approved block and its side parapets are drawn again
  `WALL_STUB` (0.22 tile) further in. The Tripo Tower and Gate stand about that far inside their tiles, which showed as
  a strip of grass at the joint. Stubs sort just under the wall's own layers.
- `src/game/TowerDoors.js` `upperDoors`: one door per face; walls on both columns put it in the middle (column 0.5).
- Tests: `tests/walls-2.test.js` (stub sides, sort order), `tests/wall-access.test.js` (one door per face).

## Implementation decisions
- No new art: the gaps come from the approved Tripo renders standing inside their footprint. Re-rendering them to fill
  the tiles would need a new Studio review, so the wall reaches in instead.
- Diagonal and elbow pieces get no stub.

## Save/Load impact
None (`wallInto` is recomputed from the layout like `connections`).

## Testing
- `npm test`.
- Browser: Gate on both axes with walls on the front and the back row, Tower with walls through a column and along a
  face: no gaps, the wall before a face is in front, one door.

## Notes for the next agent
- If the Tower or Gate art is re-rendered to fill its tiles, set `WALL_STUB` to 0.
