# Studio: round shores – marching-squares transition tiles (plan g-svet-kulate-brehy)

## What and why
World v2 step 3, the graphics half. It adds transition sets of 16 tiles for five pairs of grounds:
- water / grass, with a thin broken foam line;
- water / sand, with wide foam;
- water / mud, with a dark wet rim;
- water / stony bank, with foam on the pebbles;
- sand / grass, with a strip of dry grass.

The renderer can pick a tile from the four corners of a cell. Shores then read as round curves instead of edges blended along the diamond.

## Files and systems
- studio/src/generators/ground.js: new `transition` mode.
  - Each tile is a blend of an outer and an inner grass spec.
  - The mask is the 0.5 contour of the bilinear corner field, steepened near the corners for rounder curves and roughened by periodic noise, so neighbours match.
  - An optional edge band follows the contour.
  - The preview patch is a pond of the inner ground.
- studio/src/lib/surface.js: the validator accepts the transition specs.
- art/assets/terrain/shore-transitions and its sprites: tile-0 … tile-15 per pair.

## Implementation decisions
**Tile index.** Bits of the corners where 1 means the inner ground:
- bit 0: top corner (u=0, v=0);
- bit 1: right corner (u=1, v=0);
- bit 2: bottom corner (u=1, v=1);
- bit 3: left corner (u=0, v=1).

This is the contract for Mechaniky's m-svet-kulate-brehy.

## Save/Load impact
None.

## Testing
- npm test passes.
- validate.mjs passes.
- The preview pond was checked for seams.

## Notes for the next agent
- Mechaniky: choose the tile by the corners of each cell. A corner is inner when the majority of the four cells around it are inner.
- Then measure the renderer's performance.
