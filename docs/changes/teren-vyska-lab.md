# m-teren-vyska step 1 – terrain height prototype in the World Lab

## What and why
The owner wants height to matter in the game: build on gentle slopes, slower uphill, more sight from hilltops, with
smooth hills, sometimes nearly flat plains, water in the valleys, and river and pond banks that slope down to the water,
steeper in some places and gentler in others. Step 1 of plan task `m-teren-vyska` is a prototype in the Studio's World
Lab. The owner can tune the height sliders, check the look and readability on slopes, and propose the defaults. The game
itself does not use height yet (steps 2–3, Mechaniky).

## Files and systems
- **`src/game/terrainHeight.js` (new, pure, not imported by the game yet).** This is the algorithm the generator will
  reuse.
  - **Model:** a height at every tile corner, grid (COLUMNS + 1) × (ROWS + 1), continuous 0–`HEIGHT_MAX` (8) units. One
    unit is `HEIGHT_UNIT_PX` = 8 px, a quarter of the tile diamond's height. Tile height is the mean of its 4 corners;
    tile slope is the largest corner difference.
  - **Gameplay constants:** `BUILD_MAX_SLOPE` 1.5 (the buildable proposal), `FLAT_SLOPE` 0.35 ("nearly flat").
  - **Sliders:** `HEIGHT_SETTINGS`, levels 0–9 like `WORLD_SETTINGS`: Hilliness, Hill height, Plains, Bank slope.
    `DEFAULT_HEIGHT_LEVELS` holds the defaults.
  - **API:** `computeHeights({ground, random, levels})` and `heightsForWorld(world, seed, levels)`, which uses its own
    stream `rng(seed, 'height')`, or `height#<attempt>` after fair-start retries. Helpers: `heightAt` (bilinear, where
    units, trees and buildings stand), `tileHeight`, `tileSlope`, `isBuildableSlope`, `cornerShade` and `heightStats`.
    `heightDefaultsProposal` builds the Studio proposal.
- **`art/terrain/height-default.json` (new):** the default file the World Lab exports. Its `levels` must equal
  `DEFAULT_HEIGHT_LEVELS`; a test checks this.
- **`studio/src/world-lab/height.js` (new):** height drawing.
  - **Ground:** slope shading painted on the flat ground in world space; the flat ground is then lifted tile by tile
    as two affine triangles per tile, back to front, and the water mask is occluded for streaks and fish.
  - **Props:** a path across the slope, a house on a plinth, villagers, trees and rocks standing upright, and a villager
    behind a hill. The unbuildable tint shows on the ground.
  - **Top-down colours:** by height with hill shading, or by slope (red means steeper than 1.5).
- **`render.js`:**
  - `drawIso` takes `height: {map, on, props, unbuildable}`;
  - `drawTopDown` takes `heights` and the overlays `height` and `slope`;
  - extra asset globs load the house v3 and the villager facing-0 sprites.
- **`model.js`:** `heightsFor`, `heightChecks` (start radius 10) and `heightDefaultFile`.
- **`main.js`, `world-lab.html`, `world-lab.css`:**
  - a "Terrain height" section with 4 sliders, Defaults, note, **Propose as default** (page database
    `heightDefaults/proposal` `{levels, by, at, note, version}`) and **Export height-default.json**;
  - in the iso card, Height off/on, props and unbuildable tiles;
  - the overlay select has Height and Buildable slope;
  - a "Terrain height" block in Checks: buildable %, nearly flat %, mean and max height, mean bank slope, start buildable
    % and slope, whether water is lower than its banks, and land pinched at water level.
  - The settings persist in the Lab's localStorage draft.

## Implementation decisions
- **The height formula:** height = (0.6 + hills × plains mask × valley(distance to water)) × bank ramp.
  - **Hills:** quintic value noise on an endless hashed lattice. Its salts come from the stream, so a slider never shifts
    the other noises.
  - **Plains mask:** the threshold is the noise quantile, so the Plains slider sets the share of nearly flat land almost
    directly.
  - **Bank ramp:** `t(2 − t)` over a length of 2–8 tiles. The length varies along the bank with noise around the Bank
    slope mean. It is at least 7 tiles by fords and at least 6 by the castle.
  - **Castle:** the relief blends to the start's own relief within about 9–16 tiles, so the start area is level.
- **Water:** every corner that touches water is exactly 0. A land tile pinched between water tiles therefore has all four
  corners at 0. It is reported as `flushTiles`, not as a violation; in step 2 the generator may turn such tiles into
  shallows.
- **Default levels in the game module:** `src/` must never import `art/` except `art/ui` (asset-studio test). The levels
  therefore live in `terrainHeight.js`, like `DEFAULT_WORLD_LEVELS`; the JSON is the Studio's export.
- **Lifting:** the ground is lifted, not repainted, so the continuous ground's world-space texture stretches over slopes
  without seams. Clip triangles are grown by 0.75 px against hairlines. A triangle whose face turns away from the
  viewer is skipped.
- **Object order:** objects are drawn one diagonal row after their tile row, so the flat ground just in front does not
  cut a sprite's feet. Hills two or more rows in front still cover objects behind them.
- **Buildings on slopes:** they stand at the footprint's highest corner on a stone plinth. This is only a proposal for
  step 2.

## Save/Load impact
None. `SAVE_VERSION` is unchanged. The game neither imports nor stores heights, and the world code (MKW5) is unchanged.

## Testing
- `tests/terrain-height.test.js` (new, 6 tests) checks:
  - determinism, and the same result as the Lab;
  - heights within 0–8, water tiles flat at 0, land corners above 0, and `waterLower` with 3 lakes, a tributary and
    maximum hills;
  - banks descending towards the water ring by ring, and steeper banks at Bank slope 9;
  - Plains 0 < 5 < 9 flat share (more than 15 points apart), and Hill height and Hilliness changing the relief;
  - defaults more than 85 % buildable, with the start radius 10 fully buildable;
  - the default file and proposal format.
- A seed sweep (57 seeds) showed no water violations and a fully buildable start, even at maximum hills. Default worlds
  are 98–100 % buildable.
- `npm test`: 1216/1216 passed. `npm run studio:build` passed.
- `scripts/studio-smoke.mjs` has new World Lab assertions: stats, Plains slider, Defaults, props, the Height off/on
  toggle, the height and slope overlays, export, and `heightDefaults/proposal`. The existing "Propose as default" click
  now uses `#wl-propose`, because the page has two such buttons. The smoke was **not run** (no browser smokes in this
  task).

## Notes for the next agent
- **Not verified in a browser:** the look of the lifted ground (seams, shading strength, back-facing skips), the speed
  of the lift (about 1,600 clipped `drawImage` per redraw), the props and occlusion, water streaks behind hills, and the
  phone layout of the new section.
- **„Převzít výšku“ (proposed procedure):**
  1. Read `heightDefaults/proposal` from the Studio page database.
  2. Write its levels into `DEFAULT_HEIGHT_LEVELS` and into `art/terrain/height-default.json`.
  3. Run the tests.
  4. Delete the proposal document.

  There is no sync script yet.
- **Step 2 (Mechaniky):**
  - call `heightsForWorld(world, seed, levels)` from `generateWorld`, or `computeHeights` with `rng('height')`;
  - decide whether the levels join the world code (a new generator version, appended digits);
  - save the corners or regenerate them from the code;
  - use `isBuildableSlope` for placement and `heightAt` for drawing units and objects;
  - add the uphill speed and sight bonuses.
- **Version check:** this commit adds a file under `src/`. `version:check` treats any `src/` change as a game release,
  although the game does not import the module yet. Release it with the next game patch, or let step 2 ship it.
