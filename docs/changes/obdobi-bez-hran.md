# Season change without hard edges (0.138.1)

## What and why
Owner 15 Nov ("někde je stále ostrá hrana", screenshot): during the gradual season change some places showed hard square edges. Each step of the change repainted the chunks in view one by one over 3–5 seconds. Neighbouring chunks stood in different steps, and one step changed a place by up to half of the way, so their edge was sharp. At speed 3 the next step came before the last one finished, so edges were nearly always on screen.

## Files and systems
- `src/game/SeasonTransition.js`: `state()` returns the held (shown) step; `liveState()` the real one. `update()` holds a further step of the same change while playing and asks the renderer to prepare it; `commit()` shows it (tiles, trees, chunks with an immediate repaint).
- `src/game/TerrainRenderer.js`: `prepareSeasonStep(job)`, `prepareSeasonWork()` (8 ms a frame, at most 3 s), `prepareGround()` (blend from the existing season layers into a canvas of its own), `groundStampFor()`, `recycleGround()` (canvas pool). `chunkTexture` takes a prepared picture without painting. `groundPictureStep` accepts `{look, out}`.
- `src/data/seasonTransition.js`: steps 9 → 24, levels 12 → 24; Dev tool range for steps up to 32.

## Implementation decisions
- Only chunks whose two season layers are ready are prepared (cheap blend). Others (paths or buildings changed) repaint the old way after the commit.
- No hold when paused, at the start or end of a change, or without a renderer (tests): the step is shown at once like before.
- More steps make each step a smaller change, so any chunk that is late differs only a little.

## Save/Load impact
None.

## Testing
New test in tests/season-transition.test.js (hold until commit, no hold when paused). Browser harness at speed 3, zoom 0.4: about 80 of 86 chunks in view take each step in the same frame; before, 30–70 chunks lagged for 3–5 s.

## Notes for the next agent
`paintStats.groundPrepared` counts chunks that took a prepared picture.
