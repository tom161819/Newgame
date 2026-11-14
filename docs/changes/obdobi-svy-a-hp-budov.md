# Season squares on the ground (point 47) and hit points of fortifications (point 49)

## What and why
- Owner's screenshot, 14 Nov 2026: in winter one square of ground still showed autumn, with hard edges.
- Owner: hit points of buildings "already now".

## Files and systems
- `src/game/TerrainRenderer.js` `repaintDirty`: half painted chunks first; with more than `BACKLOG_CHUNKS` waiting the pass works for `BACKLOG_SLICE_MS` and returns after `BACKLOG_EVERY_MS`.
- `src/game/buildingHealth.js` (new): `BUILDING_HP`, `buildingHP`, `damageBuilding`, `repairBuilding`.
- `src/ui/DemolitionUI.js`, `index.html` (`#building-detail-hp`), `src/systems/GameStateSerializer.js` (optional `hp`).

## Implementation decisions
- 47, the cause: shown chunks waiting for a repaint took turns, one ground band each. Every band started a job, only eight jobs are kept, so older jobs were thrown away before they finished. A full screen (55 chunks) needed over 40 s per season step, more than a step lasts at fast speed; nothing ever caught up. Now a started chunk is finished first and a backlog gets up to 10 ms every 30 ms: a full screen in about 13 s without a GPU.
- Chunks still change one after another within those seconds; a fully simultaneous change would need all layers painted ahead.
- 49: only the number and the hook. A full building stores nothing. No enemy damages buildings and nobody repairs them yet.

## Save/Load impact
Optional `hp` on a damaged Stone Wall, Gate, Tower or Castle. SAVE_VERSION stays 62.

## Testing
- Browser (headless Chrome, 0.6 zoom, 10 game days over two season changes): stale shown chunks 51 → 0 in about 13 s; before the fix 55 → 36 in 20 s and never done while time ran.
- `tests/save-animal-retaliation.test.js` (hit points); full suite.

## Notes for the next agent
- `/tmp/perfdiag/season.mjs` (workspace only) counts shown chunks whose ground stamp differs from the wanted look.
