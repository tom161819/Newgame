# 116 – Path Lab: smooth wear transitions and a trampled-grass level

## What and why
The owner tested the Path Lab and saw a hard, tile-shaped edge where wear 2 meets wear 3 (also towards wear 1), and asked for a new first level before wear 1: only trampled grass, a dark green track. The lab now has five levels: 0 grass, 1 trampled grass, 2–4 soil (the old 1–3).

## Files and systems
- `studio/src/path-lab/v2.js` (V2_VERSION 2): the wear level is a smooth field, a Gaussian-weighted mean of the worn tiles (grass tiles excluded) sampled at a noise-warped point, used for colour, coverage, snow and the soil texture. Before, the area group took the level of the nearest tile, so mixed 3/4 areas switched colour exactly at the tile diamonds. Level 1 is a thin dark green layer (`GRASS_TRACK`) over the grass tile; the Earth texture is masked to the soil part, so trampled grass shows no soil grain.
- `studio/src/path-lab/params.js`: new `widthGrass` (level 1 width) and `levelBlend` ("Level transition", 0 = near the tile edge, 1 = over about a tile). Width labels renumbered (width1–3 are levels 2–4).
- `studio/src/path-lab/model.js`: LAB_SCHEMA 2, levels 0–4. Schema 1 JSON and saved variants still import (worn tiles move up by one). Older scenarios keep their look (shifted by one); `levels` now shows 1–4 and the new `transitions` scene shows a 1 → 4 path and a mixed 3/4 area.
- `studio/src/path-lab/current.js`: N12 reads lab level − 1, so trampled grass is grass in the production reference (the game has no such level yet).
- `main.js` brushes Wear 1 · grass … Wear 4; `scene.js` level overlay colour for level 1.

## Implementation decisions
- The level field is independent of the shapes (paths, areas), so it is equally smooth along a path, inside an area and where a path enters an area.
- Only the lab changes. The game's wear system and N12 stay at three levels; adding the grass level to the game is a separate decision for the owner.

## Save/Load impact
None in the game. Path Lab JSON schema 2 (schema 1 imports).

## Testing
- `npm test`: 786 pass, including the new five-level/migration test and a smoothness test (level changes < 0.3 per 1/8 tile along a 1 → 4 path and across a mixed 3/4 area).
- `npm run studio:smoke`: all pass (Path Lab block unchanged and green).
- Screenshots of the `transitions` and `levels` scenes with V2 Organic: no tile-shaped edges, the grass track reads as a dark green path.

## Notes for the next agent
- Tune the look in the lab first (`levelBlend`, `widthGrass`, `GRASS_TRACK` colours in v2.js); bring it into the game only when the owner picks V2 settings.
- If the game gets the grass level, the wear system needs a fourth level and N12 a grass track; until then lab level 1 is lab-only.
