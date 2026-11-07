# World v2 step 2a: generator 2 – fords, varied banks, tributary, grass zones, landscape forests, fair start (#100, plan m-svet-revize-generatoru, 7 Nov 2026)

## What and why
Step 2a of World v2 (brief `zadani-svet-v2.md`, approved by the owner on 7 Nov). The generator now makes a more natural landscape. `WORLD_GENERATOR_VERSION` goes to **2**, and world codes start with `MKW2-`. Generator 1 codes are refused with the "generator version" message, following the alpha policy.

## Files and systems
- `src/data/worldTerrain.js`:
  - new ground types `FORD` 5, `MUD` 6, `SHORE_ROCKS` 7 (`isFordGround`, `isRiverGround`, `FORD_SPEED` 0.6);
  - `GRASS_ZONE` (meadow, lush, dry, forest floor, flowers, stony);
  - generator 2 data in `WORLD_GENERATION` (`river2`, `tributary`, `banks`, `bankVegetation`, `grass`, `forest`, `rocks`, `fairStart`).
- `src/game/worldGeneration.js` (rewritten for generator 2): `generateWorld` returns `zones`, `reeds`, `forestWeight` and `stoneWeight` as well, plus `fairStartReport`, `valueNoise`, zone and reed save helpers.
- `src/data/worldCode.js`:
  - generator 2;
  - `rivers` 0–2 (2 = with a tributary);
  - `grassScale` now sets the zone size (×0.5–1.8).
- `src/data/objects/terrain.js` and `public/assets/terrain/{water,banks}/provisional-*.v0.tile-*.png`: provisional ford, mud and pebble tiles, derived from the approved sand and water tiles, until `g-svet-textury` is approved.
- Rules:
  - `PathWearSystem` takes a `groundSpeed`: a ford is walked at ×0.6 by everyone.
  - `buildings.js`: nothing is built on a ford (`status.notOnFord`).
  - `PavementTool`: fords cannot be paved.
  - `MineralSystem.generate(random, weight)`: deposits are weighted to stony country and never lie on a ford.
  - `NaturalResourcesSystem.generate(random, count, {weight, start})`: forests follow the forest weights, and a grove is added near the castle when the start has too few trees.
  - `FishingSystem`: fords belong to their river (one water body), and fishing beside a ford counts as shallow water.
- `src/game/GameScene.js`:
  - keeps `grassZones`, `reeds` and `fordKeys` (`isFordTile`, `fordTiles`);
  - loose stones and spawned resources avoid fords;
  - fair-start stones near the castle.
- `src/game/TerrainRenderer.js`:
  - blend ranks for the new grounds;
  - zone colour washes averaged over 3×3 tiles (smooth transitions);
  - per-zone decals (grass tufts, flowers, pebbles, leaves; more leaves in autumn, only pebbles in winter), hidden under buildings, resources, paving and worn paths;
  - reeds in shallow water (straw-coloured in autumn and winter);
  - ford stepping stones.
- `src/ui/Minimap.js`: colours for ford, mud and pebbles.
- `src/systems/GameStateSerializer.js`: `SAVE_VERSION` 51, with `grassZones` and `reeds` saved and validated.
- i18n en/cs: names of the new grounds, `status.notOnFord`.
- Tests:
  - `tests/world-generation-v2.test.js` (5);
  - `tests/world-code.test.js` (generator 2, fair start over 25 seeds);
  - asset counts;
  - `scripts/world-smoke.mjs` (fords, banks, zones, fair start, chunk paint time);
  - `scripts/world-code-smoke.mjs` uses `MKW2-…`.

## Implementation decisions
- **River.**
  - Full width is 3.5–5 tiles at the default level (×`riverWidth`). It narrows to about 3 at fords and gains 1–1.5 in pools (about 22 % of the length).
  - The deep core is everything more than 1.1 tiles from the edge.
- **Fords.**
  - A ford is 3 tiles of the river's length painted `FORD` across its whole width. It is walkable through the map (`mapCell` 0), and `PathWearSystem.groundSpeed` gives every walker, animals and caravans included, ×0.6 there. Pathfinding therefore prefers a ford only when it is the way across.
  - A ford never wears into a track (wear is grass only) and blocks building, paving, stones and deposits.
  - Stepping stones are drawn on top, deterministically per tile.
- **Banks.**
  - Each side of the river is split into stretches of 6–18 tiles. Each stretch rolls beach, grass, mud or pebbles.
  - Beach takes 30 % × `sandyBanks`, plus 25 % on the inner side of a bend. The remaining stretches are grass 40 %, mud 33 % and pebbles 27 %.
  - Grassy stretches get reeds in the adjacent shallow water. Lakes keep their sandy rim.
- **Tributary** (`rivers` = 2): a 2–3 tile wide river running across the main river's course. It starts at the map edge and ends where it meets the main river, has its own fords, and must stay away from the start.
  - Over seeds 1–10 at least 7 worlds get one (the test checks this). When none fits, the world has no tributary rather than an awkward one.
- **Bank vegetation.**
  - Thickets of bushes and trees follow a noise along the bank: dense, sparse or almost none.
  - Every 12 tiles along each bank a 2–3 tile lane keeps no bushes and no trees, so fishers and animals can reach the water.
- **Grass zones** (all fertile `GRASS` for the game) come from moisture (water distance + noise − desert), forest noise, rock nearness and a variation noise for flowers. The size is set by `grassScale`.
  - They are **saved** as one digit per tile, like `ground`, rather than recomputed. That keeps saves independent of later generator changes (which are expected in steps 2–3) and costs 10 kB.
  - Until the zone textures from the Studio exist, they are shown as colour washes over the approved grass plus decals. The wash of each tile averages its 3×3 neighbourhood, which gives soft transitions without masks.
  - Winter shows snow only (no wash), as the grass does today.
- **Forests and rocks follow the landscape.**
  - Trees are placed by `forestWeight`: forest noise, scaled down in dry country and zero on sand, water and access lanes, plus bank thickets.
  - Outcrops are weighted to stony noise and the desert rim, and ore deposits to `stoneWeight`.
  - The original prototype walls near the start stay.
- **Fair start.** The generator checks ≥ 250 open grass tiles within 20 and water within 30. On failure it regenerates from streams suffixed `#2`, `#3`… (up to 20), so a code still always gives the same world.
  - Trees: if fewer than 25 stand within 20 after placement, groves are added in a ring around the castle. This is skipped when Forest is below level 3.
  - Stones: 10 loose stones within 20 are placed first.
  - Over 25 seeds the generator part always passes on the first or a later attempt. The browser smoke checks the trees and stones in a real game.
- **Paint cost.** The new layers draw only when a chunk is painted (it is cached), so frame rate is unchanged. A whole chunk took 0.63 ms with them and 0.40 ms without, measured in the smoke with Chrome headless, 100 chunks.

## Save/Load impact
`SAVE_VERSION` goes from 50 to 51. New saved fields:
- `grassZones`: 100 strings of digits 0–5;
- `reeds`: `[x, y]` pairs, each on a shallow-water tile, at most one per tile.

Ground digits 5–7 are now valid, and river ground (fords included) must be rock-free. Older saves are rejected, as with every schema change.

## Testing
- `npm test` passes (907).
- `npm run smoke -- --current-only` passes with `--world --world-code --fishing --marketplace --policy --background --paths-v2 --builder-workshop --gate --building-costs`.
- The Gate smoke now starts a fixed world (`MKW2-155515555555-1`). Its wall fixture once failed to reach a row that a random world had closed in; a fixed code keeps that smoke reproducible.
- Ford screenshot checked.

## Notes for the next agent
- The World Lab (Grafika) should import the generator as is: `generateWorld(random, {levels, streams: worldStreams(seed)})` returns `zones`, `reeds`, `forestWeight` and `stoneWeight` for its checks panel. `fairStartReport` gives grass and water near the start.
- When the zone, ford, mud, pebble and reed art is approved (`g-svet-textury`):
  - replace the provisional tiles in `src/data/objects/terrain.js` (keep the ids);
  - replace `ZONE_TINT` / `ZONE_DECALS` and the procedural reeds and stones in `TerrainRenderer` with the textures.
- Step 3 (rounded shores) replaces `blendEdges` for water pairs with marching-squares pieces. The `GROUND_RANK` entries for codes 5–7 are where to start.
- Any later change to the generator's output must raise `WORLD_GENERATOR_VERSION`.
