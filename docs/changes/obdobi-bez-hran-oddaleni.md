# Season change without hard edges when zoomed out

## What and why
Owner, 21 Nov 2026: "proč tam zase vznikají ostrý přechody při změně období?" During the winter → spring change, large chunk-shaped squares showed snow next to green grass.

The 0.138.1 fix (obdobi-bez-hran) holds each step of the change until the next step is prepared for every chunk in view, then shows it everywhere in one frame. But it prepared only chunks that already had both season layers (old and new). A chunk that had just entered the change had no new-season layer yet. It was skipped and repainted after the commit, one at a time, through the normal throttled repaint queue. On a zoomed-out view there are about 80 chunks, so most of them stood one to six steps behind their neighbours. Measured in the browser at zoom 0.4: 69 of 81 chunks were behind after the second step.

## Files and systems
- `src/game/TerrainRenderer.js`
  - `prepareGround` now paints missing season layers itself, off screen, while the picture holds. When zoomed in, layers are painted in bands. `prepareSeasonWork` keeps painting a band job of the same chunk within its time slice.
  - Season layers are painted at the draft size of the view when zoomed out (paintDraftChunk; about 12 ms instead of 23 ms a chunk). A draft is always painted at once.
  - The blended picture keeps the coarser draft mark of its layers, so zooming in repaints it sharp.
  - `SEASON_PREP.maxMs` was raised from 3 s to 12 s. This is the longest a step is held before it is shown anyway.

## Implementation decisions
- The step waits rather than chunks lagging. While it is held, the season's game time keeps running. A newer step replaces the one being prepared, so the picture skips steps instead of drifting apart.
- The shown canvas may become the old season's layer. It is only read, never painted into.
- A finished look (a single season) without its layer is still skipped, as before.

## Save/Load impact
None.

## Testing
- `npm test`.
- Browser measurement script: zoom 0.4 and zoom 1 through winter → spring, counting chunks whose ground step differs from the shown step.
  - Zoom 1: no lagging chunk.
  - Zoom 0.4: lagging chunks only when the 12 s hold ran out. That happens in the headless browser at 5 fps, not at normal frame rates.
- Screenshot at zoom 1 mid-change: a soft blend.

## Notes for the next agent
- Prepare time is about 1 draft paint per frame. 80 chunks take about 1.5–3 s at 30–60 fps.
- If the hold still runs out on slow machines, consider preparing the new layer before the window opens.
