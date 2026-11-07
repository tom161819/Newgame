# Walk cycle from the walk sheets (V03, 0.28.0)

## What and why
Plan task m-animace-chuze. The Grafika chat exported a walk sheet for every approved character look (store n22, `docs/changes/studio-walk-cycle.md`). Villagers and soldiers now step through those frames while walking instead of bobbing one still image.

## Files and systems
- `public/assets/characters/villagers/<look>.v1.walk.png` – copies of `art/sprites/<asset>/<look>.v1.walk.png` for all 19 looks in `APPROVED_VILLAGER_ART`.
- `src/data/objects/approvedArt.js` – each look gets `walk:{frameWidth,frameHeight,origin,fps}` from the export metadata; `WALK_COLUMNS`, `WALK_CYCLE` (idle, stride-a, idle, stride-b), `walkFrame(k,walkedMs,fps,moving)`, `walkKey`, `hasWalk(scene,look)`.
- `src/game/HumanView.js` – loads the sheet as a spritesheet with the facings; with the sheet loaded the figure uses frame `row(facing)*3 + column(cycle)` and the sheet's common feet origin, without bob or sway; standing shows the idle column. Without the sheet (missing, failed to load) the old single image with bob stays.
- `tests/walk-cycle.test.js` – sheets byte for byte with the exports, numbers equal to the metadata, image size 3×8 frames, frame choice, fallback.
- `scripts/walk-smoke.mjs` – `npm run smoke -- --current-only --walk` (part of `--full`).

## Implementation decisions
- Frame timing uses the time spent walking at the sheet's fps (6), reset when the figure stops, so every walk starts from idle. It is not scaled by the walker's speed (a Hunter running 30 % faster with his dog keeps the same step rate); the difference is small at these speeds.
- When the sheet is present the standing figure also comes from the sheet (idle column) rather than the facing image, so the figure does not jump between two images with different sizes and origins when starting or stopping.
- `setTexture` is called only when the frame changes (`artFrame` cache).
- The optional part (soldiers by class: archer / swordsman / soldier) is not done: soldiers keep the one approved `soldier-male` look. It needs a rule for which equipment picks which class and is left for a follow-up task.

## Save/Load impact
None.

## Testing
`npm test`, smoke `--walk` (several walking villagers changed frames, no bob, standing ones on idle) and a zoomed screenshot check.

## Notes for the next agent
- Work and attack poses still rotate the image a little; they work on the walk-sheet frame as before.
- Soldier classes by equipment: follow-up (see above).
