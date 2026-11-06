# #115 – Path Lab in the Asset Studio (part 1 of the path renderer V2)

## What and why
[#115](https://github.com/tom161819/Newgame/issues/115): the owner does not want another untested change to the game's path renderer. First comes an isolated lab in the existing Asset Studio, where paths can be painted, compared and tuned. Part 2, [#116](https://github.com/tom161819/Newgame/issues/116), adds the Experimental V2 renderer to this lab. Nothing reaches the game without explicit approval.

## Files and systems
- `studio/path-lab.html` (new page in the studio's multi-page build, `studio/vite.config.js`), linked from the Studio and Phaser demo navigation. Pages publishes it under `/Newgame/studio/path-lab.html`, and the deploy now checks the file exists.
- `studio/src/path-lab/model.js` (pure):
  - `WearMap` (24 × 24, levels 0–3);
  - `stamp` and `strokeLine` for gap-free brush strokes;
  - `History` (undo/redo of one entry per stroke);
  - the seven `SCENARIOS`, with `path-to-area` as the priority;
  - `exportLab`, `validateLab` and `importLab` (JSON schema 1).
- `studio/src/path-lab/params.js`: the 14 V2 parameters with ranges, defaults and tooltips; presets Current (N12), V2 Natural subtle, V2 Organic and V2 Wild; `RENDERERS` (v2 is false until #116).
- `studio/src/path-lab/current.js`: the **Current (N12) reference**. It calls the production `TerrainRenderer.prototype` path methods on a stand-in object that reads the lab map. `src/game/TerrainRenderer.js` is neither changed nor copied.
- `studio/src/path-lab/scene.js`: draws the approved seasonal ground tiles and then the paths, clipped per tile like the game's chunk painter. It also draws the diagnostics: grid, wear levels, and the N12 centerline, areas and nodes.
- `studio/src/path-lab/main.js` and `path-lab.css`, the UI:
  - brush (Grass/Erase, Wear 1–3) with sizes 1/2/3/5, undo/redo, reset map, reset parameters;
  - seasons, pan (right-drag or Shift-drag) and zoom (wheel, buttons, Fit);
  - scenarios, preset choice and the parameter panel;
  - named variants in localStorage, JSON export (download) and import (validated), and a deep link (`#scenario=…&season=…&preset=…`).
- Tests: `tests/path-lab.test.js` (6). `scripts/studio-smoke.mjs` gains a Path Lab block, and the phone check now includes the lab.

## Implementation decisions
- **Nothing is faked.** The current renderer has no tunable geometry, so the parameters and the Experimental V2 switch are shown but disabled, labelled "Available with V2 (#116)". The V2 presets are listed as proposals, and choosing one keeps drawing Current until V2 exists.
- **The interface for #116:** `renderScene(…, {renderers})` takes a factory `(map, {earth}) => object with drawPaths(context, x, y, left, top, veil, clip)` and optionally `pathElements` for the diagnostics. This is the same contract as the production method, so an approved V2 module can later move into `TerrainRenderer` and the lab and the game share one algorithm. #116 sets `RENDERERS.v2 = true` and registers its factory.
- The lab has no obstacles, so every pair of worn neighbours may link. In the game the pathfinder decides that.
- Local experiment, export and commit are kept clearly apart in the UI. Nothing is written to `art/approvals.json` or the game.

## Save/Load impact
None. The game is unchanged; `TerrainRenderer.js` is untouched.

## Testing
- `npm test` passes (760, 6 new).
- `npm run studio:smoke` passes, including the new Path Lab block: a deep-linked scenario and season, real mouse painting with undo/redo, V2 disabled, JSON export/import round trip, invalid JSON rejected, a saved variant, no console errors, and a 390 px phone without horizontal scroll.
- Rendered scenes were inspected visually. The reference shows exactly the N12 problem #116 must solve: a narrow line ending in round blobs.

## Notes for the next agent
- #116: implement V2 as a pure geometry/mask module, for example `studio/src/path-lab/v2.js`, later shared with the game. Register it in `main.js` `renderers` and set `RENDERERS.v2`. Bind `state.config` and `state.seed`, and render all four presets on the same scenarios for comparison.
- Optional scale references (a building or the King) are not drawn yet.
