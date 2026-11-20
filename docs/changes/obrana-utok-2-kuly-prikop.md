# Defence and attack 2: Stakes and Moat

## What and why
Owner 20 Nov 2026: "zpracuj postupně všechny ty návrhy na obranu / útok. zatím udělej nějaký základní assety a modely
pak dodělám". Point 2 of the list in `claude/obrana-utok-plan.md`.

## Files and systems
- `src/data/objects/buildings.js`: `stakes` (2 Wood a tile, 4 s) and `moat` (free, 9 s), both 1 × 1, walkable,
  `construction.mode: 'line'` (dragged like a wall, repeat placement), category Defence (menu after the Tower).
  `defense: {speed, mounted, wheels}` – the speed factor on the tile: Stakes .45 / .08 / .08, Moat .35 / .3 / .02.
- `src/game/defenseWorks.js` (new): `defenseSpeed(scene, actor, tile)` from the finished Stakes and Moat tiles
  (cached by building count and construction revision); riders (`military.mounted`, `mountedHorse`, enemy
  `gameplay.mounted`) and wheels (a unit with a vehicle, `actor.vehicle`) use their own factor; someone up on a wall
  is not affected.
- `src/systems/PathWearSystem.js` `speedMultiplier`: the defence factor comes first. Pathfinding uses the same
  factor, so people walk round a short row; riders and carts practically never cross.
- `src/game/DefenseViews.js` (new): provisional drawings in code – `StakesView` (a row of sharpened stakes on a
  log; two stakes while being built) and `MoatView` (a ditch, water when finished; the water joins the next Moat tile).
  `GameScene.refreshWallConnections` repaints Moat tiles whose neighbours changed.
- Icons `public/assets/buildings/{stakes,moat}/*.svg`; names and Wiki texts in both languages.
- Tests: `tests/defense-works.test.js`; counts in `tests/assets.test.js`, `tests/building-categories.test.js`.

## Implementation decisions
- Provisional art (AGENTS rule 8): drawn in code until the owner's models are approved in the Studio.
- Walkable on purpose: the enemy army walks through (slowly) instead of breaking them, which keeps it under the archers.
- The Moat cannot yet be filled; the battering ram (point 3) is stopped by it.

## Save/Load impact
None (ordinary buildings).

## Testing
- `npm test`.
- Browser, Test map: a row of 10 Stakes and 10 Moat tiles dragged and finished; speed factors read in the page
  (foot .45 / rider .08 on Stakes, foot .35 in the Moat).

## Notes for the next agent
- The line tool's status text still says "Wall blueprints" for these lines.
