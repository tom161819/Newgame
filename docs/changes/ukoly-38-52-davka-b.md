# Owner's points 39, 42, 44, 45, 48, 51 (batch B)

## What and why
Owner's list of 14 Nov 2026. This batch: soldiers attack a wolf on a click (39), newcomers reveal no map (42), "Show links" (44), blueprints over people and goods (45), fixed Gate direction (48), pavement dragged as a rectangle (51).

## Files and systems
- `src/ui/UnitSelection.js`: `isEnemy`, `enemyAt`, `hover` (cursor), right click sets `huntWolfId` of the selected soldiers.
- `src/game/GameScene.js`: sight source `subjects` skips `arriving` residents; `placementReserved()`; `updateBuildLinks()`; Gates use the stored `gateAxis` (set once for older saves).
- `src/game/buildLinks.js` (new): `goodsOf`, `buildLinks`, `drawBuildLinks`, the switch state in localStorage `newgame.buildLinks`; switch `#building-links-toggle` in `index.html`, wired in `src/ui/BuildingBar.js` with `GameTip`.
- `src/game/buildings.js` `placementError`: a tile occupied by a drop is free. `src/systems/DropSystem.js` `clearSite(site)`.
- `src/systems/ConstructionSystem.js`: `occupied(site)`, `stepAside(worker,site)`, `obstructed` includes it; `src/systems/WorkerAI.js`, `src/game/WorkerController.js`, `src/game/AnimalController.js`: `steppingAside`.
- `src/data/pavement.js`: `defaultMode:'area'`.

## Implementation decisions
- 39: reuses the "Hunt the wolf" order (`huntWolfId`); any animal of type wolf or with `gameplay.hostile` is an enemy. Held soldiers are released for the attack.
- 44: for every input the nearest store that takes it and the nearest producer; for every output the nearest store and the nearest user. Outputs come from recipes and output piles; hunters, fishers and farms (no recipe) show no output line yet.
- 45: only the player's single-building placement ignores units; wall lines and pavement are unchanged. Goods are moved at once to the nearest free tile beside the site (same drop, same id); Haulers then store them as usual. A resident under the site gets a route computed with the site opened and may step off closed ground; the King and held units stay until moved, and the site waits.
- 48: `gateAxis` was already saved; only the drawing recomputed it from neighbours.
- 51: the Area mode existed; it is now the default.

## Save/Load impact
None; SAVE_VERSION stays 62. Gates of older saves without `gateAxis` get it on the first draw.

## Testing
- `tests/save-animal-retaliation.test.js` (points 39, 45), `tests/stone-pavement.test.js`; full suite.
- Browser (headless Chrome): a House blueprint placed over two waiting residents – both stepped off within seconds and the site was free; the links layer is shown for a Bakery blueprint.
- Not checked in a browser: the sword cursor and the attack click, the newcomers' sight, the Gate after walls are added, the look of the link lines.

## Notes for the next agent
- Points 41 (straight diagonal walls) and 47 (season seams between ground chunks) are in the plan, not done.
