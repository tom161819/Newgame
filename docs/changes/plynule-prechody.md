# m-plynule-prechody – smooth fish and gradual season change (owner points 73, 78)

## What and why

Two "popping" visuals from the owner-approved plan:

1. **Fish (73).** `FishShadows` showed a fish the moment its tile was picked and hid it the moment it was dropped. Now a
   fish rises from the depth (opacity 0 → full and scale 0.82 → 1 over 0.8 s), surfaces and dives in a slow per-fish
   cycle (up 14–26 s, down 3–7 s, from the tile hash), drifts slowly while up, and sinks away (0.8 s) when it leaves the
   pick (stock change, camera). About every 8–15 s a fully risen fish touches the surface: 1 or 2 light expanding rings
   (~1 s, the second smaller and 0.24 s later). Under winter ice the shadows are fainter (×0.55) and there are no rings.
   Leaving sight still hides a fish at once (nothing live under the fog).
2. **Seasons (78).** The continuous ground (the default ground style) changed season for the whole map at once (every
   chunk repainted on the boundary). Now the change runs 3 game days around the boundary (1.5 before, 1.5 after) in 9
   steps, in patches by a deterministic noise mask that leans on the terrain: snow first in shade (forest floor, stony
   ground) and away from water, the thaw first by water and in sunny meadows, autumn yellowing in islands. Plants and
   decorations (painted into the ground), trees, bushes, thickets and rock outcrops follow the same mask.

## Files and systems

- `src/data/seasonTransition.js` (new) – `SEASON_TRANSITION`: days 3, lead 0.5, steps 9, spread 0.7, terrain bias 0.4,
  autumn islands, noise spread, shade per zone, water reach, `layerChunks`, Dev ranges.
- `src/game/SeasonTransition.js` – `transitionState` (window around the boundary, from game time only),
  `transitionStart` / `seasonWeight` (continuous mask, normal-CDF evened noise), `terrainBias`, `blendMask`, class:
  terrain grids (shade, water distance BFS), `bias()`, `weight()`, `mix()` (now also before the boundary: returns the
  other season under the drawn one), `seasonAt()` (trees, bushes, rocks, fish ice), `groundLook(cx, cy)` (season name
  while a chunk shows one season, else a step key + mask), `update()` also queues chunks whose look key changed.
  `seasonBlend` (tile-integer API) is unchanged: the Studio imports it (`studio/src/lib/surface.js`).
- `src/game/TerrainRenderer.js` – the chunk ground stamp uses `groundLook().key` instead of the season; new
  `groundPicture()` (plain paint, or two cached season layers blended through the mask), `tileSeason()` for bushes,
  outcrops and nature groups; `paintStats.groundBlends` / `groundMs`. `SEASON_YEAR` now comes from SeasonTransition.
- `src/game/GameScene.js` – hooks `terrain.seasonAt` and `terrain.seasonGroundLook` next to `seasonMix` (one line).
- `src/data/waterLife.js` – `WATER_LIFE.ripple` (8–15 s, 1 s, 1–2 rings), `fade`, `surface`, `drift`, `ice`; pure
  helpers `stepFade`, `fishLook`, `surfaced`, `ringAllowed`, `nextRingMs`, `ringCount`, `ringLook`.
- `src/game/FishShadows.js` – fade / surfacing / drift / leaving / `touch()` with 1–2 rings / `frozen()`.
- Dev tool: `src/data/devBalance.js` `DEV_LOOK_KEYS` (`seasonDays` 1–5 step 0.5, default 3; `seasonSteps` 4–16,
  default 9), `src/ui/DevBalancePanel.js` fold "World look", i18n `dev.tool.look`, `dev.balance.key.season*`,
  `dev.balance.days` (en, cs).
- **For the Grafika chat:** `src/render/continuousGround.js` and `src/render/pathSurface.js` are **not changed**. The
  blend happens one level up in `TerrainRenderer.groundPicture()`: each chunk paints its old and new season look once
  per change with the existing painter, and every step only composites them through the mask. Plants therefore
  cross-fade with the ground mask (they are part of the chunk picture). If the Grafika chat changes how a season is
  painted, the transition follows automatically.

## Implementation decisions

- **Composite instead of per-pixel season blending.** A first version blended the season look per pixel inside
  `paintContinuousGround` (nicer frayed snow edges), but every step then repainted every visible chunk (~45 ms each in
  headless Chrome): 109 repaints in 40 s at ×3, FPS −12 %. Now a chunk mid-change keeps two layers (old, new season;
  ~0.8 MB each, layers of chunks in view are never evicted, others beyond 36 are) and a step costs one mask (~3 k weight
  samples) + 3 drawImage calls, ~5 ms. The new-season layer is painted once per change – what the old flip cost anyway.
  At the end of the change the new layer simply becomes the chunk's picture (no repaint).
- Chunks whose whole area is before (or after) the change keep the plain season key (`groundLook` samples each chunk's
  start bounds once per change, margin 0.12), so steps touch only chunks really in the middle of it, and step 0 paints
  nothing.
- The noise piles up around 0.5; a normal CDF (`noiseSd` 0.17) spreads the starts so every step changes a similar share.
- Window centred on the boundary (`lead` 0.5) per "3 days at end/start of season"; `lead` 0 would put it all after the
  boundary like before. With 5-day seasons, 2 plain days stay between changes; Dev "days" is capped at 5.
- Fish surfacing cycle added so fish appear/disappear naturally, not only on camera/stock changes. A long frame moves the
  fade by at most 100 ms, so a hitch never pops a fish. A ring that falls due while a fish is still rising waits for it.

## Save/Load impact

`SAVE_VERSION` unchanged, no new save data: the state of the change is computed from the seasons' cycle day and elapsed
time. The Dev values `seasonDays` / `seasonSteps` live in the existing optional `devBalance` save field (only when they
differ from the defaults), like the forest values.

## Testing

- `npm test`: all pass. New `tests/smooth-transitions.test.js` (fish fade rises/falls smoothly in ~0.8 s, rings 8–15 s,
  1–2 rings, none on frozen water, `FishShadows` with a fake scene: fade-in without popping, rings only in summer,
  sinking on leave; mask compositing; Dev keys). `tests/season-transition.test.js` rewritten for the 3-day window
  (progress 0 → 1 over 3 days, weight 0 → 1 monotonic, deterministic, patchy, terrain bias, chunk looks, Load from time).
- Browser smoke `--smooth-transitions` (new, `scripts/smooth-transitions-smoke.mjs`, world MKW5-155515555555-1): fish
  rise frame by frame, rings on the river, autumn → winter screenshots at steps 0/1/3/5/7/8/after with mean brightness
  105 → 105 → 115 → 149 → 172 → 174 → 174 (no step does half the change), trees/bushes mixed mid-change, no rings under
  ice, Load mid-change gives the same step, chunk looks and picture, FPS. Screenshots `/tmp/shots/smooth-*.png`, numbers
  `/tmp/smooth-transitions.json`.
- FPS (headless Chrome, software rendering, 2 CPUs shared with other agents, 40 s per run at ×3): plain spring 49.8,
  spring → summer running 51.2, plain summer 53.5 FPS – 0.8 % below the average of the plain runs. The change itself
  (54 layer paints + 92 blends, the first two steps of the window) took 2.05 s = 5.1 % of the time at ×3; later steps
  are blends only (~1.7 % at ×3, about a third of that at ×1). Earlier runs on a busier machine varied ±20 % between
  the two plain runs, so the paint time is the more reliable number.
- `--season-transition` (updated to the 3-day window), `--world-look-2`, `--dev-tool` (25 sliders now), `--dev-balance`
  and the main smoke pass.

## Notes for the next agent

- `SeasonTransition.update()` takes ~33 ms the first time in a game (terrain grids + chunk bounds), then 3–9 ms per step.
- Scrolling to a new area mid-change paints both layers of each newly visible chunk at once (two paints instead of one).
- The legacy `tiles` ground style still uses `mix()`; `mix()` now also answers for the old season before the boundary.
- Tunables: `src/data/seasonTransition.js`, `src/data/waterLife.js`; Dev tool → World look for days and steps.
