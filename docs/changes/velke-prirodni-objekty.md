# Large nature objects: thickets, rock ridges, 2 × 2 rocks and 3 × 3 deposits

## What and why
The Studio review of 8 Nov 2026 approved nature art that was not in the game yet, because no game object of that size existed (see nasazeni-prirody-a-pesin.md, "Notes for the next agent"):
- thickets 2 × 1, 2 × 2 and 3 × 2 (hazel, bramble, autumn, winter);
- the rock ridge (4 × 2; granite, slate, winter);
- 2 × 2 rock obstacles (two outcrops, boulders, rocks with a bush, winter);
- 3 × 3 stone and iron deposits (granite and red ore, each with a winter look; limestone, slate, mossy, veins and dark ore were rejected).

This change adds the game objects and deploys that art.

## Files and systems
- src/game/natureGroups.js (new): "nature groups".
  - A group is `{kind:'thicket'|'rocks', x, y, w, h}`. It covers tiles that keep their ordinary per-tile objects: a thicket's bushes stay in `scene.bushes`, and a rock group's tiles stay rock (`terrainGrid` 1).
  - Sizes: thicket 3 × 2, 2 × 2, 2 × 1; rocks 4 × 2 (ridge) and 2 × 2 (obstacle).
  - `pruneNatureGroups(scene)` drops a group once a part is gone (a bush cut, a rock mined) or something stands on it (a resource, a placed building).
  - Save helpers (`exportNatureGroups`, `importNatureGroups`, `validateNatureGroups`) and the generator helpers (`rockGroupFor`, `mergeThickets`).
- src/game/worldGeneration.js, src/data/worldTerrain.js (`rocks.widths`, `thickets`):
  - `placeRocks` now cycles the widths 2, 3, 2, 4, 3 (always two rows). A placement on open ground only becomes a group when it is 2 × 2 or 4 × 2. 3 × 2 stays single rocks (there is no 3 × 2 rock art). Groups cut by the river, a ford or the start walls are dropped.
  - `mergeThickets` (its own random stream `thickets`) scans the map, largest size first. It merges grass bushes (never desert scrub) into thickets where a tile is 1–4 tiles from water or in the forest-edge band of the forest weight (0.3–0.85). A patch missing up to a third of its bushes gets them (60 % chance) from the patch's main bush kind, where a bush may grow (grass, not a water lane, not near the start).
  - `generateWorld` returns `natureGroups`.
- src/data/minerals.js, src/data/objects/minerals.js: `stone_deposit_large` (200–320 Stone, 2 per world) and `iron_deposit_large` (150–240 Iron Ore, 1 per world), size 3, `family` = the ordinary type. The ordinary counts went from 5 + 4 to 4 + 3. `depositFamily()` is used where a Quarry or an Iron Mine matches deposits: MineralSystem candidates and canBuildOver, and the save checks. The large deposits reuse their family's SVG, so the page gets no new file.
- src/data/experience.js: mining a large deposit gives the same XP as its family.
- src/game/natureArt.js:
  - `depositLook` shows the large pile while more than 2/3 is left (winter: the large winter pile), then the medium/small logic as before.
  - `thicketLook`: spring and summer show hazel, or bramble when at least half the bushes are berry bushes; autumn and winter have their own looks.
  - `rockGroupLook`: one of the approved looks picked by position, and the winter look in winter.
- scripts/export-nature-art.mjs packs the new approved variants into the atlas: 93 frames, 1024 × 607. The atlas file is now `nature-atlas.v2.png`. It replaces v1, so the page still holds one atlas file and no browser keeps an old cached atlas with other frame rectangles. src/data/natureArt.js is regenerated.
- src/game/TerrainRenderer.js (game layer, not src/render):
  - `paintNatureGroups` draws one atlas sprite per group in view. The sprite sits at the footprint centre (the Studio anchor = the frame origin) and its depth is the front (bottom) tile's centre plus the bush or outcrop depth offset.
  - The bushes and rock sprites of covered tiles are skipped.
  - The fog fast path repaints a group (normal or remembered look) instead of forcing a full redraw.
- src/game/DepositView.js: the hit area and the fallback drawing scale with the footprint (×1.5 for 3 × 3).
- src/systems/RockMiningWork.js: `markTile` on a group tile marks or unmarks every tile of the group (`markOne` is the old per-tile mark).
- src/game/GameScene.js:
  - creates, loads and prunes `natureGroups`;
  - the world fingerprint has a `natureGroups` part;
  - loose stones (the start placement and the spawner) keep off thicket tiles.
- src/systems/NaturalResourcesSystem.js: `reserved()` includes thicket tiles, so trees and deposits do not grow into thickets.
- src/systems/GameStateSerializer.js: the `natureGroups` field, SAVE_VERSION 61, and deposit checks for any footprint.
- i18n: names and descriptions of the large deposits (en, cs).

## Implementation decisions
- **A group is a drawing over the existing objects, not a new kind of object.**
  - Walking, building placement, line of sight, fog, map memory, mining, clearing and wall plans keep their per-tile rules, so footprints are respected without new code paths.
  - Rock groups block like rocks (a rock group's tiles are rock).
  - Thickets behave like bushes: **bushes in this game do not block walking or building** (they are decoration; a building hides them). The task text said "impassable like bushes", but bushes are walkable. Thickets follow the actual bush rules. Making them block would need a new map cell type, see the notes below.
- **Clearing.**
  - Mark to clear on any tile of a group marks the whole group.
  - A Woodcutter cuts a thicket bush by bush (3 s each) with no yield, exactly what its bushes give.
  - A free Miner mines a rock group tile by tile, 10 Stone each: 40 for a 2 × 2 obstacle, 80 for a ridge.
  - When the first part goes, the group ends and the rest show as single bushes or rocks. There is no partly cleared art.
- **When a group is drawn.** Only while every tile is known (explored or in sight) and every part shows. A bush under a building, paving or a worn path does not show. Otherwise its parts are drawn one by one as before. The atlas must be loaded; the per-tile art stays as the fallback.
- **Large deposits are their own types** (`*_deposit_large`, 3 × 3) with a `family`. That makes the footprint, map blocking, minimap, map memory, hit testing and the save tile checks follow the definition's size. The start Quarry rule (m-kamenolom-u-hradu) still uses an ordinary deposit.
- **Rock widths.** The old generator alternated 2 × 2 and 3 × 2. Generator 4 cycles 2, 3, 2, 4, 3, which gives about 24 rock obstacles and 12 ridges per default world. Thickets per default world: about 8–12 of 2 × 1, 1–6 of 2 × 2, 2–5 of 3 × 2.
- **Art placement.** The Studio exports leave a margin inside the footprint: the visible art covers about the inner 60–70 % of the footprint diamond, with the anchor at the footprint centre. The 2 × 2 deposits already in the game are drawn the same way. The smoke screenshots with the outlined footprint show this.

## Save/Load impact
- SAVE_VERSION 60 → 61 (alpha policy: only the current schema loads; schema 60 saves are refused, nothing is migrated).
- New field `natureGroups`: a list of `['thicket'|'rocks', x, y, w, h]`. Validation:
  - the kind and size must be known;
  - the footprint must lie inside the map;
  - a thicket needs a grass bush on every tile, and a rock group needs rock on every tile;
  - groups may not overlap.
  An absent field means no groups. Groups are pruned before saving.
- Resources may be `stone_deposit_large` / `iron_deposit_large` (reserves checked against their own ranges). The Quarry/Iron Mine binding checks now use the real footprints instead of the hard-coded 2 × 2 / 3 × 3.
- WORLD_GENERATOR_VERSION 3 → 4 (codes MKW4-…). A generator-3 code is refused for a New Game; saved games keep their code (decode with `current:null`). All smoke scripts with fixed codes were moved from MKW3- to MKW4-.

## Testing
- tests/nature-groups.test.js (new):
  - generated groups have the approved footprints, lie on their parts, never overlap, keep the start clear, and every size appears;
  - determinism of groups and bushes for one code; another seed gives other groups;
  - the merge fill rule;
  - a thicket is walkable; marking one tile marks all its bushes; a Woodcutter clears them with no yield;
  - rock groups block walking and building; one mark orders the whole group; yield 10 per tile;
  - pruning after a resource or a building lands on a group;
  - Save/Load round trip and forged groups rejected;
  - 3 × 3 deposits: larger reserves, a Quarry over one and an Iron Mine near one bind to them, Save/Load, forged reserves rejected.
- tests/nature-art.test.js (extended):
  - every approved thicket, ridge, 2 × 2 rock and 3 × 3 deposit variant is packed (pixel check by the existing test) and its metadata footprint matches the game object;
  - rejected variants are absent;
  - the looks for every season;
  - the large pile above 2/3, the medium pile below.
- Updated: world-code (generator 4, MKW3 refused for New Game), minerals (4 + 3 + 2 + 1 deposits), assets (2 more definitions), the SAVE_VERSION assertions (61).
- `npm test`: 1182 pass, 0 fail.
- Browser (`npm run build -- --base=/Newgame/`), scripts/big-nature-smoke.mjs (`npm run smoke -- --current-only --keep-going --big-nature`):
  - a New Game from MKW4-155515555555-7KQ9X2 has thickets of all three sizes, ridges, 2 × 2 rocks and both large deposits;
  - each group is one `nature-atlas` sprite at its footprint centre, with depth = front tile + offset, and its parts are not drawn;
  - autumn and winter thickets and the winter ridge;
  - the large deposits show the large pile and fall back to the medium pile below 2/3;
  - Save → Load keeps `natureGroups` and the large deposits, and the thicket is drawn again;
  - no 404s or page errors;
  - screenshots in /tmp/shots/big-nature-*.png (each with a `-footprint` copy outlining the footprint in red).
- Also passed: the main `--current-only` smoke, and `--world-code` (now also compares natureGroups), `--marking`, `--depleted-mine`, `--start-v2`.

## Notes for the next agent
- Thickets do not block walking because bushes do not. If the owner wants blocking thickets, add a map cell code that blocks but is see-through (like WATER_CELL; lineOfSight.js treats anything but 0 and WATER_CELL as opaque). It would have to be restored wherever the map is rebuilt from `terrainGrid` (buildingRemoval, ConstructionSystem cancel, wallReplacement, MineralSystem.restoreTiles). Then add a generator bump for the fairness checks.
- There is no rock art for 3 × 2, so those placements stay single rocks. A 3 × 2 rock export would only need an entry in `NATURE_GROUP_SIZES.rocks`, `ROCK_GROUP_LOOKS` and `rockGroupFor` (its width is already in `rocks.widths`).
- The ridge exists only as 4 × 2 (long along x). A 2 × 4 ridge would need its own export (mirroring would flip the light).
- Partly cleared thickets and partly mined ridges fall back to single bushes or rocks. Stage art would need a stage field in the group (and a save change).
- The page still holds 512 of 512 files: the atlas was renamed (v1 → v2), not added.
- Re-run `node scripts/export-nature-art.mjs` after a Studio revision of these assets. Bump the atlas file version when frame rectangles change.
