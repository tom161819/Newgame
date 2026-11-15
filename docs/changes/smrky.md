# Spruces like the oaks (0.138.0)

## What and why
The owner sent a spruce pack: 3 sizes × 4 seasons × 4 views (message from 15 Nov 06:09, "postupuj jako u dubů"). Spruces now use these renders and move in the wind like the oaks.

## Files and systems
- `scripts/tree-wind.py` (was `oak-wind.py`) builds wind sheets for oak and pine into `public/assets/resources/<species>/wind/` and writes `src/data/objects/treeWind.js` (`TREE_WIND`).
- `src/render/treeWind.js` replaces `oakWind.js`: lazy sheet loading, tracking of live trees, wind frame per tile.
- `src/render/treeSeasonTexture.js`: `treeLook(species, natural, season, hash)`; `PINE_OLD_DAYS = 14`.
- `src/game/TreeView.js` draws trees from sheets (frame 0 = original image).
- `NaturalResourcesSystem.flushGrowth` repaints a spruce when it becomes mature.
- Studio: 48 pine variants in `art/sprites/pine-tree`, approved per the owner's message.
- Static PNGs in `oak_tree/art` and `pine_tree/art` removed.

## Implementation decisions
- Sizes: young 45 px, medium 112 px, mature 183 px. Pack mature is used from age 14 days.
- One sheet per look and season holds all 4 views and 12 frames, so the file count drops.

## Save/Load impact
None. Look is derived from tile hash, stage and age.

## Testing
Full suite passes. Browser harness: 216 trees on sheets, about 70 animating, no errors; summer and winter screenshots checked.

## Notes for the next agent
Add another species by extending `SPECIES` in `scripts/tree-wind.py` and the `treeLook` mapping.
