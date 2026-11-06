# #116 – Natural Path Renderer V2 in the Path Lab

## What and why
[#116](https://github.com/tom161819/Newgame/issues/116) is part 2 of the path work. The owner dislikes the N12 geometry in four ways:
- straight paths are ruler-straight;
- 90° turns are sharp;
- areas are regular;
- worst, a narrow path ends in a round blob on a trodden area.

V2 changes the geometric principle, and it runs **only in the Path Lab** (#115) for comparison and choice. The game and `src/game/TerrainRenderer.js` are unchanged. Integration comes in a separate issue after the owner picks a preset.

## Files and systems
- `studio/src/path-lab/v2.js`, a pure geometry module plus a canvas painter:
  - **Topology:** worn tiles become a graph, using 4-neighbours and a diagonal only where no corner tile is worn, as in N12, so there are no false links. Tiles in any 2 × 2 worn block are area tiles, and links between two area tiles are dropped. Maximal runs become chains, ending at junctions, dead ends or areas, so a 1-tile-wide line never turns into an area.
  - **Centerlines:** straight runs are reduced to their turning points, and every turn is filleted with a real radius (`cornerRounding × minCurveRadius`, limited to half the runs beside it). A light corner-cut follows. Points are resampled every 4 px and drift sideways with world-space value noise: `meanderStrength`, `meanderFrequency`, and `meanderSmoothness` (octaves). The drift fades out where a chain meets a junction or an area, so joins line up.
  - **One surface:**
    - each pixel gets a signed distance to path capsules, whose width follows wear 1/2/3 and grows towards an area over `blendDistance`, and to the area tiles' rounded diamonds;
    - within one shape the union is exact; different shapes meet with a polynomial smooth minimum (`areaSmoothness`), so a path flows into an area or another path;
    - the area outline gets a broad, low-frequency wobble and the edge a two-scale noise (`edgeIrregularity`, `noiseScale`), so no circles, squares or diamonds remain;
    - `edgeSoftness` controls the fade and the halo, and the wear level is blended, so 1 → 2 → 3 changes colour and density smoothly.
  - **Paint:** the core in the approved track colours with the soil centre of the approved Earth track texture, plus a translucent edge halo. Snow tones match N12's winter veil. It is computed at half resolution with spatial buckets.
- `studio/src/path-lab/main.js`, `scene.js`, `params.js`:
  - `RENDERERS.v2 = true`; the renderer factory passes the live config and seed;
  - the scene draws a renderer with `drawScene` in one pass;
  - the overlay shows V2 centerlines and area tiles;
  - slider changes repaint, debounced to the next frame, and mark the preset "Custom".
- Tests: `tests/path-lab.test.js`, with 4 new V2 tests. `scripts/studio-smoke.mjs` now checks the live V2.

## Implementation decisions
- **Distance field rather than circles:** a smooth union of exact shapes gives one continuous mask for paths and areas, which solves the path → area join directly. That join was the top priority.
- **World-space, seeded noise:** the result is stable across refresh, zoom and season, and an edit far away does not move a path (tested).
- **Portable to the game:** the module has no lab state, and it can be evaluated per chunk with the same buckets. Fog of War, Map Memory, pavement precedence and per-chunk invalidation are integration work for after the approval.

## Save/Load impact
None.

## Testing
- `npm test` passes (path-lab 10 tests: topology, determinism, continuity, rounding, meander on/off, inside/outside, blend widening, wear widths, locality, performance).
- `npm run studio:smoke` passes. It checks that V2 Organic differs from N12 on the same map, that a slider repaints V2 and makes the preset Custom, and that Current returns pixel-identical.
- A comparison grid of 5 scenarios × Current/Natural subtle/Organic/Wild was inspected (in the PR).

## Notes for the next agent
- When the owner chooses a preset (or a Custom JSON), create the integration issue: port `v2.js` into a shared module used by `TerrainRenderer` per chunk, respect Fog of War / Map Memory (remembered levels and links), pavement, map edges and local invalidation, and add regression tests. PATH_WEAR rules stay unchanged.
