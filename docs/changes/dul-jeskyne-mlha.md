# Rounder caves, rock obstacles and fog of war inside the mine (0.143.9)

## What and why
Owner 17 Nov 2026: the mine looks much better; make it less sharp-cornered (some corners may stay sharp, mostly rounder and more broken, like a real cave) and add various rocks and rock obstacles. Then: check how the fog of war works there – it did not: the rock was drawn above the fog layer, so the whole cave showed from the start.

## Files and systems
- `DungeonView.dungeonShapes` adds `shift(vx,vy)` (a corner of rock jutting into a passage moves toward the rock, a pocket corner toward the floor, 55–105 % of the way to the tile centre, 14 % keep the edge; straight edges waver), rock `isIsland` (components ≤ 16 tiles not touching the border), island heights 22–32 px. All drawing goes through the shifted corners, floor included, so it stays seamless.
- Faces: one or two slabs per tile (fewer regular stripes). Islands show a lit rock top.
- `caveDecor`: on ~8.5 % of free floor tiles (not by the entrance, chests or rats) a boulder, stalagmites (more by the walls), rubble or a puddle – non-blocking.
- `zoneFeatures`: 1–3 pillars/outcrops (1–4 tiles) per cavern, at least 2.2 tiles from its middle, kept only if every cavern stays reachable.
- Fog: the floor and the deep rock (flat black) are at depth −70, under the fog layer (−60). Standing rock is in pieces (a screen row × 8 tiles) with a darkened copy; `update()` (each frame, only when `fog.revision` changes) hides unexplored pieces and decor, dims remembered ones. `createDungeonView` now returns `{objects, update, destroy}`; `GameScene.update` calls it.

## Implementation decisions
Visibility per piece of 8 tiles, not per tile: a remembered piece may reveal a few unseen wall tiles next to it.

## Save/Load impact
None.

## Testing
tests/dungeon.test.js (reachability with pillars on 4 seeds, rounding, islands); npm test; browser: Test map → Inside the mine, then fog on with one soldier at the entrance – only his surroundings show.

## Notes for the next agent
GROUP (8) sets the fog granularity of walls. The Test map has the fog off; the zone game uses the player's setting.
