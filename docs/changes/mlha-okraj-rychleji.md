# Fog edge on hilly ground: fewer draws

## What and why
Follow-up of the performance test (`claude/test-vykonu-0.146.md`, handover 19 Nov 2026): with relief the fog edge is laid tile by tile (`FogEdgeLayer.project`), every dark tile twice (an overlap pass that closes gaps between tiles lifted differently, then the tile itself). About 400 clipped canvas draws for one edge; 40–80 ms in the test browser.

## What changed
- The overlap pass is skipped for a tile whose dark neighbours all sit within `FOG_EDGE.liftMerge` (0.1 screen px) of its own lift – there is no gap to close.
- Neighbouring dark tiles in a row whose lifts differ by at most 0.1 px are laid as one piece with their mean lift.
- `stats.pieces` / `stats.darkTiles` count the draws.

## Measured (test browser without GPU, 201 dark tiles)
| zoom | before | after | pixels changed | largest difference |
| --- | --- | --- | --- | --- |
| 1 | 54 ms | 42 ms | 0.3 % | 3 / 255 |
| 1.6 | 83 ms | 68 ms | 0.4 % | 2 / 255 |
| 0.6 | 42 ms | 35 ms | 0.8 % | 4 / 255 |

A first try with a 0.35 px tolerance saved 27 % but changed edge pixels by up to 91/255 (visible), so the tolerance is kept at 0.1 px.

## Files and systems
`src/game/FogEdgeLayer.js` (`FOG_EDGE.merge`, `liftMerge`; `noMerge` on the layer switches it off for comparisons).

## Implementation decisions
- Each tile keeps its exact lift unless its neighbours are within 0.1 px, so the anti-hairline drawing (wipe and add inside the clip) is unchanged.
- The overlap pass keeps its back-to-front order for the tiles that still need it.

## Save/Load impact
None.

## Testing
- Full suite.
- Browser: old and new projection of the same mask compared pixel by pixel (`/tmp/perf/edge2.mjs`).

## Notes for the next agent
- The remaining cost is the canvas draws themselves (~0.13 ms each in software). A real cut needs the edge on the GPU (a lifted mesh with the mask as texture); an earlier GPU attempt (0.94, rotated image) drew the edge in the wrong place. Wait for the owner's F8 table before doing that.
