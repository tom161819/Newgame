# Performance 3: zooming out and big maps; economy test fixes

## What and why
The owner reported (13 Nov 2026) that the game lags when the view is zoomed out, mostly on big maps. Measured on a 200 × 200 map without Fog of War, Canvas renderer, headless Chrome without GPU: zooming from 1 to 0.25 froze the game for 3.5 s in one frame and 8 s in all (254 ground chunks painted at once, ~33 ms each). Now the same zoom has no frame over ~120 ms.

## Files and systems
- src/systems/ConstructionMaterialsSystem.js `rebook`, src/systems/LogisticsTaskManager.js: site materials booked in an unreachable store move to a reachable one.
- src/data/nightThreats.js: `fires.spreadChance` .15 → .05.
- src/game/TerrainRenderer.js: `DRAFT_VIEW`, `draftScale`, `draftStale`, `paintDraftChunk`, `groundPainter(…, scale)`, `paintRelief(…, scale)`, time budget for first-seen chunks in `repaintDirty` (`FIRST_PAINT_MS`), `viewZoom` in `update`.
- src/game/GroundComposite.js: `sync` keeps the cache while the zoom moves and draws a newly shown chunk alone.
- src/ui/TutorialGuide.js: `placed()` remembers the last bubble placement while its inputs are the same.
- tests/performance-3.test.js.

## Implementation decisions
- Draft ground: at zoom ≤ 0.5 the ground is painted at half size, at zoom ≤ 0.3 at a quarter, and stretched. The screen shows no more detail at those zooms. A draft is marked on its canvas (`canvas.draft`). When the view zooms in past the limit, draft chunks become dirty and are repainted in full by the existing band-by-band job (one a frame).
- The zoom used is the smaller of the camera zoom and the zoom target, so a zoom-out paints drafts from its first frame.
- First-seen chunks share 12 ms a frame, nearest the screen centre first. The first frame of a game still paints all.
- The ground cache (Canvas renderer) was redrawn in full every frame of a zoom and for every chunk that came into view. Now a zoom-out builds it once for the target view, and a new chunk is drawn alone.
- The tutorial/tip bubble searched thousands of spots five times a second (about 7 % of a frame). Now only when a box it depends on moved.

- Economy test (64 game days, autopilot, /tmp/perfdiag/econ.mjs): the Starter Stockpile got walled in by buildings; three sites waited 58 days for materials booked there. `rebook` moves such bookings. One fire burnt 10 of 19 buildings although the village had a Well, so the spread chance went down.

## Save/Load impact
None.

## Testing
- tests/performance-3.test.js (draft rules, ground cache).
- /tmp/perfdiag/zoom.mjs (workspace only): 200 × 200 map, zoom 1 → 0.25, pan, ×3.
- Full suite. tests/heating.test.js failed once under load and passes alone (not related).

## Notes for the next agent
- Still open: at zoom 0.25 on a 200 map about 2000 objects are drawn; WebGL would help most. Panning at 0.25 rebuilds the ground cache each time the view leaves its 160 px padding.
- The ground picture cache (`groundCache`) is never trimmed; on a 200 × 200 map fully explored it can reach ~330 MB.
