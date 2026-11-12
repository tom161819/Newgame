# m-teren-vyska: terrain height in the game, part 1 (rules and shading)

## What and why
Owner, 12 Nov 2026: "přidej do hry výšku terénu". Plan item `m-teren-vyska` (decisions of 8 Nov: height matters for
play, smooth hills with near-level plains, water in valleys, banks sloping to the water). Step 1 (World Lab prototype,
`src/game/terrainHeight.js`) existed since 0.85.0. This release brings the height map into the game with all its rules;
the map is still drawn flat, hills read through slope shading.

## Files and systems
- `src/game/terrainRelief.js` (new): `buildRelief(ground, seed)` → corner map from `computeHeights`, mean height and
  slope per tile, sight bonus per tile (height above the mean within 10 tiles), corner shade. `setRelief` /
  `currentRelief` hold the running world's relief for the pure modules. `RELIEF_RULES` holds every number.
- `src/game/GameScene.js`: builds the relief right after the world (new game and load), `fog.sightBonus`.
- `src/game/pathfinding.js`: an uphill step costs up to twice as much. `src/game/movement.js`: `advanceMovement`
  walks uphill slower by the same rule (`climbFactor`). Downhill is unchanged.
- `src/game/buildings.js`: `placementError` → `status.tooSteep` (`tooSteep`: 1.5 units for buildings, 3 for crops,
  one-tile pieces exempt). Texts in `src/i18n/cs.js`, `en.js`.
- `src/systems/FogOfWarSystem.js`: `sightBonus` hook adds whole tiles to a source's radius.
- `src/game/TerrainRenderer.js`: `paintRelief` – slope shading inside the ground picture (whole, band or rectangle).
  `src/ui/Minimap.js`: the same shade on known ground.
- `tests/terrain-relief.test.js`.

## Implementation decisions
- **Not saved, no generator change.** The relief follows from the saved ground and the world seed, so old saves get
  hills too and `SAVE_VERSION` / `WORLD_GENERATOR_VERSION` stay. Consequence: the height sliders are not in the world
  code yet (every world uses `DEFAULT_HEIGHT_LEVELS`), and resources are not moved to hills.
- One random stream name (`height`) for every world. The World Lab adds the fair-start attempt (`height#2`); a loaded
  game does not know the attempt, so a world that needed more attempts shows other hills in the Lab than in the game.
- Flat drawing first: lifting the ground means moving every object, the fog, paths, picking and depth order by the
  height. That is a separate, larger step; the rules here do not depend on it.
- Buildings already standing on a slope in an old save stay.

## Save/Load impact
None in the format. Behaviour: a loaded older game gets hills (slower uphill walking, sight bonus, build limit).

## Testing
- `npm test`: 1256 pass (5 new). Browser: `--recruits`, `--performance` pass (village ×1 32 FPS, ×3 29 FPS, within
  the baseline). Screenshot check of the shading in a new game.

## Notes for the next agent
- Part 2: lift the ground and everything on it (spec step 3 "Kreslení"), picking through height, depth order.
- Part 3: height levels in the world code and on the World Generator screen (`WORLD_GENERATOR_VERSION` + 1), rocks
  and ore rather on hills, a terrain card in the editor.
- No tile tooltip shows height or slope yet; the build preview only says "too steep".
- Wagons and caravans use the same climb rule as people (the spec wants them stricter).
