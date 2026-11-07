# #100 World generation: rivers, beaches, desert and bushes (7 Nov 2026)

## What and why
Plan item `m-100-generovani-sveta` asks for a more varied new-game map. Every new game now has:
- one meandering river across the whole map, with sandbar fords;
- one lake;
- beaches along the water;
- one desert;
- about 250 bushes.

The start area (radius 13 around the king) stays plain grass, so the castle, the stockpile and the first houses always fit.

## Files and systems
- `src/data/worldTerrain.js` (new): ground codes, rules and generation settings.
  - Ground codes: GRASS 0, BEACH 1, DESERT 2, SHALLOW 3, DEEP 4.
  - `WATER_CELL` = 2 for the pathing map.
  - `isWaterGround`, `isFertileGround`.
  - `WORLD_GENERATION`: river width, fords, lake, desert, bushes.
  - `BUSH_TYPES`.
- `src/game/worldGeneration.js` (new): `generateWorld(random)` returns `{terrain, ground, bushes, summary}`.
  - It runs rocks (`createMap`), then the river, lake, desert and bushes.
  - Pure and driven by the injected random, so a seed gives the same world.
  - Rocks are removed from water and from within 2 tiles of every ford.
  - `mapFromWorld` builds the pathing map.
  - Save helpers: `exportGround`/`importGround` (one digit string per row) and `exportBushes`/`importBushes` (`[x, y, type]`).
- `src/game/GameScene.js`:
  - `terrainGrid` (rocks), `groundGrid` and `bushes` come from `generateWorld` or from the save.
  - `map` comes from `mapFromWorld`.
  - Path wear only counts grass tiles.
- `src/game/lineOfSight.js`: water (`WATER_CELL`) is transparent, so arrows fly across a river.
- `src/game/buildings.js` `placementError`: fields and orchards (`crop`) need grass and give the new `status.needsGrass`. Houses and other buildings may stand on sand.
- `src/systems/NaturalResourcesSystem.js` `generate`: trees only on grass.
- `src/game/TerrainRenderer.js`:
  - Sand and water tiles are drawn per tile.
  - Edge and corner blending in rank order: grass over desert over beach over shallow over deep. A higher neighbour's texture fades into the tile, using cached 64×32 feather canvases.
  - Winter dusts the beach and lightly frosts water.
  - Bushes are pooled sprites, like rock outcrops, and use the muted memory copy under Fog of War. They are hidden on tiles with a building, resource, paving or a worn path (level 2 or more).
- `src/ui/Minimap.js`: colours for beach, desert, shallow and deep water.
- `src/data/objects/terrain.js` and `decorations.js`, plus i18n:
  - New object definitions `beach_sand`, `desert_sand`, `shallow_water`, `deep_water` and `bush_meadow`, `bush_berry`, `bush_flowering`, `bush_scrub`.
  - Status text `status.needsGrass`.
- Art, approved by the owner in the Studio on 7 Nov:
  - `public/assets/terrain/sand/`, `public/assets/terrain/water/` (four tiles each, from `art/sprites/wild-ground`).
  - `public/assets/decorations/bushes/` (from `art/sprites/bush`).
- `scripts/world-smoke.mjs` (new, `--world`) and `tests/world-generation.test.js` (new). Asset counts were updated in `tests/assets.test.js`.

## Implementation decisions
- **Separate ground layer.** The ground layer is kept apart from the rock layer. Every existing `terrainGrid === 0/1` rule still means "no rock", and rock mining is unchanged.
- **Water in the map.** A water cell is 2 in `scene.map`: every walk and build check asks for 0, while line of sight treats only non-zero, non-2 cells as opaque. Restores from `terrainGrid` never touch water because nothing can be built on it.
- **Fords are beach-sand tiles across the river** (one every 18–26 tiles of river), so both banks stay connected. The test asserts more than 99 % of walkable tiles are reachable over 25 seeds.
- **Bushes are decoration only.** They have no gameplay effect yet and are walkable. Their visibility filter is evaluated in the renderer's view walk; the cache key includes the number of buildings, the topology revision, the number of resources and the wear revision.

## Save/Load impact
`SAVE_VERSION` 42. Saves gain:
- `ground`: 100 strings of 100 digits.
- `bushes`: a list of `[x, y, type]`.

Validation checks:
- no rock in water;
- bushes are unique, on open, non-water tiles and of a valid type;
- actors, resources, drops, paving and vehicles are not on water.

A save without the fields (test fixtures) reads them as all grass with no bushes.

## Testing
- `npm test`: 843 tests pass.
- Smokes pass: `--world`, `--minimap`, `--farm-plots`, `--farmer-establishment`, `--forestry`, `--fog`, `--pavement`, `--walls`, `--gate`, `--marketplace`, `--policy`, `--rock-mining`, `--minerals`, `--wildlife-clearance`, `--unit-commands`, `--building-unlocks`, `--demolition`, `--forestry-workers`, `--stables`, `--housing`, `--military`, `--horse-wagon`, `--needs`.

## Notes for the next agent
- The art is approved in the Studio (preferred: beach, bush-meadow). If a new version is approved, copy the new tiles into `public/assets` and update the paths.
- Shore shapes still follow the diamond grid, softened by blending. Rounder shores would need a transition tile set (marching squares).
- Not done yet (candidates for a follow-up):
  - berry bushes as a food source;
  - animated water;
  - bridges and fishing;
  - desert-specific resources;
  - a world seed in the setup dialog.
