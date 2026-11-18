# Performance with many soldiers (30 soldiers on the home map)

## What and why
Owner 18 Nov 2026: "udělej test optimalizace … když jsem přidal 30 vojáků do domovské mapy s budovami, tak hrozně klesly fps", then "udělej vše" for the seven proposals in the project document `claude/test-vykonu-0.146.md`.

The measurement showed the simulation costs 2–5 ms a frame even with 60 soldiers. The time went to the ground and the Fog of War: soldiers marching in a group trod a band of path on every order (grass becomes a path after 3 passes), every path change repainted ground chunks and uploaded them twice to the GPU, and every step of a soldier changed the fog revision, which rebuilt the fog edge over the whole screen.

## What changed (the seven proposals)
1. **Soldiers do not tread paths** (`PathWearSystem.treads`): `enter` ignores soldiers; `affects` (the speed bonus on paths) still applies to them.
2. **Paths batched**: `PathV2Layer` compares the shown levels and rebuilds the path geometry at most every 2 s (was 0.5 s). Chunks out of view already waited until seen.
3. **Fog edge**: with more than 12 sight sources the edge is rebuilt at most every 200 ms (`FOG_EDGE.busySources`, `busyRebuildMs`); with few sources at once as before (late masks flashed newly seen ground).
4. **Fog revision only on a real change** (`FogOfWarSystem.update`): a source that moves inside ground already seen updates `sources` but not `revision`/`added`/`removed`, so the terrain fog patches, the fog edge and the map memory stay put.
5. **One GPU upload per chunk** (`TerrainRenderer.uploadFlat`/`flushFlat`): with relief the lifted picture is shown and drawn from the flat canvas on the CPU, so the flat texture is uploaded only when it is the one shown (level chunk, relief off, chunk leaving the view).
6. **Ground time budget**: after a chunk repaint the next waits at least four times as long as that one took (`TERRAIN_DUTY` 4), so the ground takes at most about a fifth of the time.
7. **UI**: the kingdom bar is placed and drawn once a second (or at once after a window resize); the hover check with a still mouse every 250 ms (was 120).

## Measured (headless browser without GPU; JS time per second, so independent of the frame rate)
| 30 soldiers, 14 buildings | before | after |
| --- | --- | --- |
| standing, fog off | 74 ms/s | 70 ms/s |
| walking, fog off | 199 ms/s | 50 ms/s |
| walking, fog on | 306 ms/s | 200 ms/s |
| still arriving, fog on | 363 ms/s | 299 ms/s |

Terrain on the march: 138 → 1 ms/s (fog off), 205 → 86 ms/s (fog on). The fog edge did not get cheaper in this browser: one projection with relief costs ~40 ms there and the frame rate (3–5 FPS without GPU) is below the 200 ms limit. On a normal machine the limit caps it at 5 rebuilds a second.

## Files and systems
`src/systems/PathWearSystem.js`, `src/game/PathV2Layer.js`, `src/systems/FogOfWarSystem.js`, `src/game/FogEdgeLayer.js`, `src/game/TerrainRenderer.js`, `src/ui/KingdomOverview.js`, `src/game/GameScene.js`; test `tests/performance-soldiers.test.js`.

## Implementation decisions
- Soldiers' own marches no longer leave paths at all (the simplest of the options in the report). Paths to the walls now come only from other residents.
- `brightness()` of the fog uses the current sources; values cached by revision (`sightFade`) may stay a moment older when only sources inside seen ground moved. Not visible in testing.
- The fog edge keeps 0 ms rebuild with few sources: the reason for 0 (newly seen tiles flashing bright before the mask) still holds there.

## Save/Load impact
None. SAVE_VERSION stays 65.

## Testing
- Full suite; `tests/performance-soldiers.test.js` (no soldier wear, fog revision, single upload).
- Before/after with `/tmp/perf/cmp.mjs` (old build on port 5198, new on 5199), same scene.

## Notes for the next agent
- The next big cost with Fog of War is `FogEdgeLayer.project` with relief: every dark tile is laid with its own clip. Drawing it as a mesh or in WebGL would remove most of it.
- Ask the owner for an F8 table from his machine with 30 soldiers marching.
