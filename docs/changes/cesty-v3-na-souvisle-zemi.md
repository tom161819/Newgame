# Paths V3 on the continuous ground (Path Lab rework)

## What and why
Owner, 8 Nov 2026: "úplný rework path lab, aby to sedělo na nový povrchy a terény, teď to vypadá podle původních textur" and "plochy ať se tvoří jenom tam kde je pěšina prošlapaná ze všech stran". Paths were V2 overlays (flat colours and the old Earth tile grain) laid per tile over the ground, which looked foreign on the continuous ground (flat dark-green blobs, tile lines); 2 × 2 worn blocks became square areas.

## Files and systems
- src/render/pathSurface.js (new): the path painted inside the continuous ground pass, per pixel: trampled grass (darker, paler, blade grain pressed out, patchy), soil by wear level with smooth grass islands, own soil grain, pebbles, worn centre, soil colour by what it lies on (earth by level, sand on beach/desert, dark on mud, gravel on shore rocks, more pebbles on stony), packed brownish snow in winter, trampled border, plants kept off the path. Settings + colours (PATH_SURFACE_SETTINGS / _COLORS), defaults in src/data/pathSurface.json.
- src/render/continuousGround.js: `surface` option (distance + level on the coarse grid, apply per land pixel).
- src/game/pathV2.js + studio/src/path-lab/v2.js: an area only where a full 3 × 3 block of worn tiles contains the tile (was 2 × 2).
- src/game/TerrainRenderer.js: continuous mode paints paths in the cached ground (no V2 tile overlays); PathV2Layer reports changed tiles → per-chunk path revision in the ground stamp (repaints roll one chunk per frame).
- Studio Path Lab: renderer "New ground (V3)" (default), ground choice (meadow, lush, dry, flowers, stony, sand, mud, mixed zones, river bank), "Surface (V3)" panel with sliders and colours, "Propose for the game" (pathProposal/default; then „převzít cesty“). V2 shape parameters still apply.

## Implementation decisions
- The shape (meander, widths, areas) stays V2 (the owner's pesinav2); only painting is new.
- The soil does not use the ground grain: that grain is a grass-blade texture.

## Save/Load impact
None.

## Testing
npm test (1104 pass), studio smoke (Path Lab V3 default, surface slider repaints), lab renders on 4 grounds/seasons (~400 ms), game: worn paths and a 4 × 4 area painted in the ground cache, FPS unchanged.

## Notes for the next agent
- Tree shade over a bare soil area shows a faint regular dapple pattern (the shade layer, not the path).
- When the owner proposes surface settings, copy pathProposal/default.surface into src/data/pathSurface.json (and config/seed into pathStyle.js if changed).
