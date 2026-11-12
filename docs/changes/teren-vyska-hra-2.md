# m-teren-vyska: terrain height in the game, part 2 (lifted ground)

## What and why
Owner, 12 Nov 2026: "zvednutí tak jak je ve World Labu, tak ho nasadit i do hry." Part 1 (0.94.0) brought the height
map and its rules with a flat picture. Now the picture is lifted: 1 height unit = 8 px (`HEIGHT_UNIT_PX`), up to 64 px.

## Files and systems
- `src/game/isometric.js`: `setProjectionLift(fn)`; `gridToWorld`, `tileCenter`, `tilePolygon` subtract the lift,
  `worldToGrid` / `worldToTile` read a screen point back through it (five fixed-point rounds). `gridToWorldFlat`,
  `worldToGridFlat`, `tileCenterFlat` are the old projection. `clampMapCenter` stays flat.
- `src/game/terrainRelief.js`: `setRelief(relief, {lift})` sets the projection lift from `heightAt`.
- Flat users (they paint into the flat ground picture or frame the flat map): `TerrainRenderer.js`, `PathV2Layer.js`,
  `pathV2.js`, `render/pathSurface.js`, `ui/Minimap.js`. Everything else follows the lift without a change, because all
  42 users go through `isometric.js`.
- `src/game/TerrainRenderer.js`: `liftChunk(key, rects)` – the shown picture of a chunk (`terrain-lift-x-y`, 66 px
  taller) is its flat picture drawn tile by tile through an affine map (one piece for a tile whose corners lie in one
  plane, else two triangles; a level tile or a level chunk is a plain copy), back to front, pieces overlapping by 1 px
  (`inflate`). After a fog patch only the touched tiles are drawn again unless a tile of the chunk may cover the one
  in front. Bush, rock and nature-group sprites use the lifted projection. The view takes 66 px more ground below.
- `src/game/GroundComposite.js`: chunks back to front; `image.tight` (the filled part of a lifted picture).
- `src/game/FogEdgeLayer.js` (Canvas): the mask is laid in blocks of 3 × 3 tiles, each moved up by the lift at its
  middle, replacing what lies under it.
- `src/game/GameScene.js`: `reliefLift`, localStorage `newgame.terrainLift`, address `?lift=off|on`; `setRelief(null)`
  on shutdown. `scripts/browser-smoke.mjs`: smokes run with the lift off; `performance-smoke.mjs` turns it on.

## Implementation decisions
- **One switch in the projection** instead of touching every view: depth order keeps working because depths come from
  the (now lifted) y, and the lifted y still grows toward the viewer on any slope that faces the viewer.
- **The flat chunk stays the unit of painting** (ground, paths, fog, memory, seasons – all of performance-2 keeps
  working); lifting is a last step on the finished picture.
- Smokes click by the flat formula in about twenty scripts, so they run flat. The lift is covered by a unit test
  (projection round trip on a generated world) and by screenshots.

## Save/Load impact
None.

## Testing
- `npm test`: 1259 pass (new: lifted projection and reading back).
- Browser (lift off): `--woodcutter-trees`, `--torches`, `--recruits`, `--hud-cargo` pass. `--performance` (lift on)
  ran six times: village ×1 13–32 FPS, so it passes or fails the baseline by the run. The spread was there before the
  lift too (0.92.0: 20–32 FPS; the slow runs show Phaser's own render at 12–25 ms instead of 2–5 ms, cause unknown).
- Screenshots in headless Chrome: hills at zoom 0.75, the start with Fog of War.

## Performance (headless, no GPU)
- Saved 30-resident village: ×1 34 → 29 FPS, ×3 31 → 22 FPS (same session, runs vary by several FPS).
- Performance smoke (village right after a fast-forward): about 22 / 20 FPS, before 27–32. The baseline file was
  re-measured and says so. Costs: `liftChunk` 1–2 ms a frame, composite redraws +2.5 ms, more chunks in view.

## Notes for the next agent
- **Not done from the spec:** things behind a hill are not hidden by it (the ground is drawn under all objects);
  buildings on a slope have no plinth; night lights and shadows ignore height; with WebGL (`?renderer=webgl`) the fog
  edge is not lifted.
- Rewriting the smokes' click helpers to `gridToWorld` of the game would let them run lifted.
- Faint lines can show in the dark fog edge where two mask blocks with different lift meet.
- Part 3 (height levels in the world code and generator screen, rocks on hills, editor) is open.
