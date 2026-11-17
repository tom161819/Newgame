# Inside the mine: rock walls, black beyond, winding tunnels (0.143.8)

## What and why
Owner 17 Nov 2026: inside the mine, the rock that cannot be walked should look like rock (the tunnel wall) and the view behind it should stay black, so only the rock at the sides of the tunnels shows; the tunnels should wind and have wider and narrower places.

## Files and systems
- `src/game/DungeonView.js`: `dungeonShapes(wall,size)` (pure: rock tiles, faces towards a passage east/south, lips west/north, edge flag, corner height – 9 px where a passage lies above the corner on screen, else 34 ± 6). `createDungeonView` draws the cave floor (depth −60, darker by the walls) and the rock row by row (x + y; depth = the row's centre): black tops, rough slab faces lit from the upper left with cracks, knobs and a dark foot, a lip where a top meets a passage, black faces at the map border.
- `GameScene`: creates it for `land.dungeon`; `TerrainRenderer` draws no rock outcrops there.
- `zoneFeatures`: the whole mine is mud ground (no rock decor), caverns are a disc plus three overlapping hollows, corridors are `tunnel()` – a wandering walk (drift ±1 rad) carving a width that breathes between 0.75 and 2.3, finished straight so it always arrives.

## Implementation decisions
Provisional procedural art like the bandit camp; a Studio rock texture can replace the faces later. The low front corners keep the floor visible behind walls on the near side.

## Save/Load impact
None (the mine map is built from the zone's world code).

## Testing
tests/dungeon.test.js (every cavern and chest reachable on 4 seeds, narrow and wide runs, faces and heights), tests/scouting.test.js; npm test; browser: Test map → Inside the mine.

## Notes for the next agent
Wall height TALL/LOW at the top of DungeonView.js. Lighting (torches) would fit here.
