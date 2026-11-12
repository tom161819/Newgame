# performance-2: 30 residents without stutter

## What and why
Owner, 12 Nov 2026: with about 30 residents the game ran at about 6 FPS. The diagnosis (project doc
`claude/diagnostika-vykonu-0.91.0.md`) found the frame time in four places, in this order: Fog of War repaints of the
terrain, ground repaints after path wear, the residents' simulation at speed ×3, and fixed costs of the UI. The owner
asked for steps 1–5 of the proposed plan. Step 5 (not drawing off-screen objects) was already in place in
`GameScene.refreshVisibility`; nothing was added there.

Measured in headless Chrome without GPU (Canvas, 1440×900), the same saved village with 30 residents, 12 s each:

| | 0.91.0 | now |
|---|---|---|
| speed ×1 | 29 FPS (p95 frame 50–133 ms) | 44 FPS (p95 33–67 ms) |
| speed ×3 | 24 FPS (p95 67–150 ms) | 42 FPS (p95 33–50 ms) |
| terrain per frame at ×3 | 24.5 ms | 4–6 ms |
| simulation per frame at ×3 | 12.8 ms | 2.6–3.2 ms |

A village measured right after it grew (the worst case of the diagnosis: 15 FPS at ×1, 6.8 FPS at ×3) now runs at
about 50 and 41 FPS. Numbers move by several FPS between runs; the machine is shared.

## Files and systems
- `src/game/TerrainRenderer.js`
  - `applyMemory` + `greyGround`: the remembered look of a chunk's ground is kept as a second canvas (the old formula
    at weight 1) and drawn over the ground through the memory field as an alpha mask (one small image stretched over
    the tiles with bilinear smoothing, `source-atop`). It replaces the per-pixel `shadeMemory` in chunk repaints and
    in fog patches. `shadeMemory` stays as the reference; on opaque pixels the two differ by at most 6 of 255.
  - `applyFogPatches`: patches are collected and applied every `FOG_PATCH_EVERY_MS` (150 ms, 300 ms at speed 2–3),
    at most `FOG_PATCH_BUDGET_MS` (3 ms) a frame, only for chunks in view (others wait until they scroll in), per
    quarter of a chunk. No `getImageData`.
  - Path changes: `pathSignature` (distance and level on the painter's coarse grid) and `pathDiffRect`. A chunk whose
    stamp moved but whose signature is the same keeps its ground (`groundSkips`); a small difference repaints only
    that rectangle (`groundPartial`, also for the two season layers of a gradual season change).
  - Whole paints of a chunk that already shows a picture are spread over frames (`groundJobs`, `GROUND_BAND` = 36 rows
    a frame, plants last); `groundPicture` returns null until the job is done and the chunk keeps its picture.
  - `groundPainter` splits a ground paint into `ground(context, rect)` and `plants(context, rect)`.
- `src/render/continuousGround.js`: `paintContinuousGround` takes an optional `rect` and paints only that part, with
  the same pixels a whole paint gives there (unit test `tests/ground-rect.test.js`).
- `src/game/GroundComposite.js`: `touch(key, rects)` redraws only the patched rectangles of a chunk.
- `src/systems/NeedsSystem.js`: `homes()` is cached by residents, finished houses and the last assignments; `order`
  is memoised. `src/systems/DailyRest.js`: the home is looked up once, not once per building in `find`.
- `src/ui/TutorialGuide.js`: a shown tip is placed five times a second. `src/game/GameScene.js`: the hover is looked
  up at once when the pointer moves, otherwise every 120 ms. `src/style.css`: no `backdrop-filter` on the panels over
  the map.
- `scripts/performance-smoke.mjs`: no Escape at the start.

## Implementation decisions
- The look must not change: the new shading is the same linear mix as before, only done by the canvas. The ground
  rectangle repaint is exact by construction (the paths reach the ground only through the sampled grid).
- Speed over promptness where nobody can see it: remembered grey follows sight within 0.15–0.3 s, a path's new look
  may take a second longer.
- `PATH_PARTIAL_SHARE` 0.4: a larger difference is cheaper as a banded whole paint than as one long partial paint.

## Save/Load impact
None. SAVE_VERSION stays 62. All new state is render cache.

## Testing
- `npm test`: 1250 pass (new: homes cache, ground rectangle and bands).
- Browser: `--performance` passes. `--paths-v2`, `--fog`, `--fog-brightness` and `--smooth-transitions` fail the same
  way on untouched 0.91.0 (they predate the 0.86–0.90 UI changes); they were not repaired here.
- Own checks in headless Chrome: new shading against `shadeMemory` per chunk; patched fog against a full repaint
  (0.06 % of pixels differ, animated flames); banded and partial ground against a whole paint (44 of 56 layers
  identical, the rest differ in under 80 colour values).

## Notes for the next agent
- Not measured with a GPU. On the owner's machine the share of each part may differ; ask for the F8 profiler table.
- After a load in the middle of a season change, and when a season change starts, every chunk in view needs one or
  two whole ground paints (about 110 ms each without GPU). They are now spread (about 7 ms a frame), so the game runs
  at 20–27 FPS for 10–15 s instead of freezing. A real fix would paint the ground in a Web Worker.
- A chunk seen for the first time during a season change is still painted at once (two layers, about 220 ms).
- `GameApplication.snapshot()` failed its own check once in a day-26 test village ("Save check failed") and passed
  on the next try: worth a look (autosave says it will retry).
- Smokes listed above need repair by whoever owns the UI they click through.
