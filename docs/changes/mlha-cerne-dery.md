# Fog of War: no black holes or flat grey strips at the edge of sight

## What and why
Owner, 9 Nov 2026 (Grafika chat), with 4 screenshots from the 0.83.0 report: "ten fow se mi furt nezdá pořád dělá chyby". The screenshots show:
- black jagged notches and holes inside land in sight, with residents and a deer standing on them;
- flat dark grey diamond strips between the black and the land.

## Cause
I reproduced it in the browser: the king explores while 24 vision sources walk around him. Two causes came from the 0.80.0 performance work, which spreads chunk repaints over frames:
1. **Neighbour edge rings.** Each ground chunk blacks out the unexplored tiles in a 1-tile ring around its own edge, so plants reaching over the edge do not show. When such a tile is first seen, only its own chunk was repainted at once. The neighbour chunk waited in the queue, and its stale black diamond stayed drawn over the now visible tile. In the composed ground the chunk was correct but the composite pixel was black.
2. **Throttled ground repaint.** A first-seen chunk whose ground was due for a repaint skipped the fog redraw as well. Ground repaints are allowed one a frame, and path wear every 750 ms. The chunk then dropped back into the slow queue, so new land stayed black or showed as flat grey under the memory veil.

## Files and systems
- src/game/TerrainRenderer.js: updateFog (urgent neighbours), chunkTexture (`paintingUrgent`, `staleGround`, returns `painted`), repaintDirty (passes the urgency, refreshes the composite).
- tests/terrain-invalidation.test.js: 2 new tests.

## Fix
- **Urgent neighbours:** a tile seen for the first time marks its chunk and every chunk whose edge ring covers it as urgent.
- **Fog over stale ground:** an urgent chunk always redraws its fog at once, over the previous ground picture (`paintingUrgent`, `staleGround`). The chunk stays dirty and its ground repaints in its turn.
- **Composite refresh:** chunkTexture returns `painted`, and every painted chunk refreshes the composed ground, even when it is still dirty.

## Implementation decisions
- **Repaint the fog over the stale ground, not the ground itself.** The fog redraw is cheap (one drawImage plus overlays). The ground repaint stays throttled, so 0.80's performance gain stays.
- **Do not repaint visible ↔ remembered changes at once.** They keep the normal queue: they only change shading, never show black.

## Testing
- tests/terrain-invalidation.test.js: urgent neighbour chunks, and a fog-only urgent repaint that refreshes the composite while the ground stays pending.
- Browser check: the king walks 5 legs (25+ tiles) into unknown land with 24 moving vision sources, checking pixels of tiles in sight every 250 ms.
  - Before: black tiles in sight that stayed for 0.75 s or longer (3 checks in a row), some in chunks that were already repainted.
  - After: none in 4 runs.
  - FPS without GPU stayed about the same (41–42).

## Save/Load impact
None.

## Notes for the next agent
- The unexplored edge is still a hard black tile staircase by design: tiles are diamonds. Softening it would be a separate visual task.
- The browser check script is not in the repo. It uses the main page with `window.__game`, adds a `stress` vision source with 24 random walkers through `fog.registerSource`, and reads canvas pixels at the centres of tiles in sight.
