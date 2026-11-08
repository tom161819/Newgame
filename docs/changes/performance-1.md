# m-vykon-fps – frame profiler and the first performance fixes (performance-1)

## What and why
Playtest 0.76.0 reported 44 FPS at the start and 12–33 FPS at ×3 with a larger village. Step 1 adds a developer frame
profiler (Dev mode → F8, or "Profiler · F8" in the Balance panel) that shows the time per frame split by system
(average and 95th percentile over 10 s). Step 2 fixes what it showed, in order of measured benefit, without changing the
simulation. All numbers are from `scripts/performance-smoke.mjs` (headless Chrome, software rendering, Canvas, 1440×1000,
seed 77123, 10 s per scenario; the smoke's other page sleeps while measuring).

| Scenario | FPS before (0.78.0) | FPS after (3 runs) | frame ms avg before → after |
|---|---|---|---|
| start ×1 | 55.2 | 58.1 / 57.4 / 52.4 | 18.1 → 17.2–19.1 |
| village 25 residents ×1 | 21.7 | 39.5 / 37.6 / 31.7 | 46.1 → 25–31.5 |
| village 25 residents ×3 | 7.2 | 30.6 / 33.1 / 28.5 | 139.3 → 30–35 |
| night ×1 (25 residents, night speed ×3) | 8.4 | 36.2 / 33.4 / 25.6 | 118.9 → 28–39 |

Profile before (ms per frame, avg / p95), village ×3: terrain 62.5 / 124.8 (fog edge repaints of ground chunks), Phaser
render 42.3 / 68.4 (28 chunk images of 640×320 px blended every frame), pathfinding 6.7 / 43.2 (one Porch seat search
failing over the whole map every step), "game time: nature" 6.2 / 20.4 (tree growth: two full-map floods per waiting
tree every game second), workers 5.9. Night ×1: terrain 47.1, render 47.1 (the night light map adds two full-screen
textures). Start ×1: render 2.5, HUD/hover 0.75 – the start was already fine once the other smoke page stopped sharing
the CPU (the earlier "44 FPS at start" was that contention in the test browser plus the first seconds after New Game).
After, village ×3: render 6–13, terrain 4.5–5.3, workers 2.8–3.3, pathfinding 0.2–1.3, nature 0.4–0.6.

## Files and systems
- `src/systems/FrameProfiler.js` (new): the profiler. `src/ui/DevBalancePanel.js`: F8 (Dev mode only), the
  "Profiler · F8" button and the `#dev-profiler` overlay (`src/style.css`, i18n `dev.profiler.*` in en/cs).
- `src/game/pathfinding.js`: `findPathToAny` = profiler hook + faster A* (same routes) + an exact early "no route" for goals
  shut in a pocket of ≤ 64 tiles; new `reachableCount` (= `reachableTiles(...).length` without the list).
- `src/systems/NaturalResourcesSystem.js`: `flushGrowth` reads building tiles once and keeps the reachable count between
  the trees of one pass (`preservesRoutes(tile, cache)`), invalidated whenever a tree changes stage.
- `src/game/TerrainRenderer.js` (not `src/render`): fair, bounded repaint of already shown dirty chunks; first-seen
  ground repainted at once; path-only ground repaints throttled; `greyRemembered` caches its pixel→tile map; the Canvas
  renderer draws chunks through `src/game/GroundComposite.js` (new).
- `src/game/NightOverlay.js`: the additive glow texture is drawn cropped to the box of its light brushes.
- `scripts/performance-smoke.mjs` (new, `--performance` in `scripts/browser-smoke.mjs`), `scripts/performance-baseline.json`.
- Test-only: `scripts/population-smoke.mjs` navigation fixture now starts in full daylight (see Testing).

## Implementation decisions
- Profiler: wrappers are installed on the scene's system objects only while it is on and the originals are put back
  when it is turned off (own vs prototype methods handled), so off costs nothing; the frame is framed by Phaser's
  `prestep`/`postrender` events (Phaser binds its loop and `sys.sceneUpdate` at boot, so `game.step`/`scene.update`
  cannot be wrapped). Self time: a measured call inside another (pathfinding inside workers, needs inside game time)
  is booked to itself, so rows add up to the frame. The only permanent hook is one boolean check in `findPathToAny`.
- Simulation fixes are exact rewrites, not throttles: no system runs less often, so ×3 still runs the same 3 steps.
  The A* computes the same costs/estimates and heap order (speeds asked once per tile per search, neighbours tested on
  map rows); the pocket test relies on steps being symmetric (`canStep`), so it returns the same `null`. Rejected:
  path caches or a per-frame path budget with a queue (timing would change results).
- Terrain (visual-only timing): shown dirty chunks take turns least-recently-painted first, 1 per frame, at most every
  50 ms and per chunk every 200 ms (was: the first 8 in view order every frame – the last ones starved). A chunk with
  first-seen ground is painted at once, so walking into the unknown never shows black holes; a fog edge leaving a tile
  may turn grey up to a few hundred ms later (the soft FogEdgeLayer gradient is still per frame). A change of trodden
  paths alone repaints a chunk's ground at most every 750 ms; seasons and buildings keep one a frame.
- GroundComposite (Canvas only): the shown chunks are composed into one cache (view + 160 px, at the zoom, origin at whole
  world pixels so zoom 1 is pixel-exact) and redrawn only in the rectangle of a repainted chunk, in the scene's order;
  a full recompose when the zoom, the view size or the chunk set changes or the view leaves the padding. The chunk images
  stay in the scene (visible, same textures, smokes read them) but their `renderCanvas` is a no-op. WebGL is untouched.
- Renderer default left at Canvas: in the test browser WebGL (SwiftShader) measured 3–4 FPS in the village (texture
  uploads), and Auto already picks WebGL only for hardware GPUs; switching every player's default without a GPU
  measurement would be a guess. HTML panels: same-value DOM writes every frame were measured (guarding all of them gave
  ~+3 FPS at the start only) and left for a later task.

## Save/Load impact
SAVE_VERSION unchanged. Nothing new is saved; the profiler lives only in the page (Dev mode in localStorage as before).

## Testing
- `npm test`: 1143/1143 (new `tests/pathfinding-performance.test.js`: 960 random searches identical to the previous A*
  incl. failures, `reachableCount` = `reachableTiles().length`; new `tests/frame-profiler.test.js`). Economy/determinism
  tests unchanged and green. `npm run build -- --base=/Newgame/` OK.
- `scripts/balance-sim.mjs` (20 days): it is not run-to-run deterministic even on 0.78.0 (two before runs: day 20 food
  340/192, wood 217/216, residents 24/21); two after runs (food 244/336, wood 177/199, gold 407/408, residents 23/23,
  happiness 84) fall inside that spread.
- Smokes, each alone: `--performance` PASS (baseline written from an after run); `--tutorial`, `--world-look-2`,
  `--approved-art`, `--dev-balance` PASS; `--population` PASS after the fixture fix; `--day-night` flaky as known
  (1 of 3 runs passed, "skip stops at dawn" race; 44 FPS at night in its log vs 26 before);
  `--fog` fails at "subject sight 7.5 by day, half at night" – the same assertion fails on 0.78.0 (6.25 there,
  5 here): sight ramps at dawn/dusk and the test accepts only 7.5/3.75. With that check relaxed locally all three fog
  scenarios (including the black/grey/normal terrain pixels) passed; the smoke itself is left unchanged.
- `--population` navigation: the King's sight grows with the morning light (6.7 → 8.3 tiles); the faster build reached
  the fixture at dawn, so 37 tiles were explored during the camera pan (seen in 0.78.0 too, run to run). The fixture now
  advances game time to full daylight first (the baseline is loaded back after the test).

## Notes for the next agent
- Grafika (src/render): the biggest single costs left are in the continuous ground. (1) `paintContinuousChunk` →
  `paintContinuousGround` takes ~40–56 ms per chunk without GPU; trodden-path changes of 25 walkers re-stamp chunks
  ~3×/s at ×3 – now gated to one every 750 ms, still a 40 ms frame each time (the p95 of "terrain"). A cheaper partial
  repaint of the path surface, or a precomputed chunk background, would remove it. (2) In `chunkTexture`, with
  `groundStyle==='continuous'` the N12 `drawPaths` overlay still runs for every worn tile (the `else` of
  `pathStyle==='v2'&&this.v2&&!continuous`), with `context.filter` per remembered tile: ~2.5 of ~6 ms of a fog repaint.
  If `pathSurface` already draws the paths, skipping it there is a visual decision for Grafika. (3) `greyRemembered`
  still does get/putImageData of the whole 640×320 chunk (~1.5–3 ms).
- Remaining frame costs at ×3: Phaser render 6–13 ms (software raster; the night light map's dark texture is full
  screen), workers ~3 ms (`WorkerSystem.navigationMap` copies the map for every route), "ui: hover/select" ~1 ms,
  ~10 ms a frame outside JS (compositing in software).
- The profiler table: groups sim / pathfinding / view / fog / minimap / ui / render / phaser; rows are labels from
  `PROFILE_TARGETS` (add a row there for a new system). `profiler.report()` returns the same data for scripts.
- `performance-smoke.mjs`: `PERF_MEASURE_MS` shortens a run, `PERF_WRITE_BASELINE=1` rewrites the baseline,
  `PERF_SAVE_VILLAGE=/path.json` stores the grown 25-resident village (snapshot) for profiling. FPS varies ±15 % run to
  run in this browser; the 20 % tolerance is tight for "village ×3" – re-run before treating a failure as a regression.
