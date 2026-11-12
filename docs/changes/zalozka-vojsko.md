# m-zalozka-vojsko: Army tab, Patrol and Guard; lifted-terrain checkerboard fix

## What and why
Owner, 12 Nov 2026 (9): a tab beside Buildings with the soldiers and what they do – Patrol (they patrol the walls
and the settlement by themselves) and Guard (they stand on a tower or where they are put); a click moves the camera to
the soldier and marks him, Shift for more. Approved in the plan; the two questions in the spec were left unanswered, so
the proposals stand (patrols go on at night – soldiers are exempt from the daily rest already).

Also a fix of 0.96.0: `liftChunk` drew a planar tile through the outline N, E, W, S – a bow-tie – so half of such
tiles stayed empty (a black checkerboard on gentle slopes). Found on a screenshot taken for this task; the screenshots
of 0.96.0 were taken before the planar-tile shortcut went in.

## Files and systems
- `src/ui/ArmyPanel.js` (new): `armyRows(scene)`, `armyPick(current, id, shift)`, `ArmyPanel` (tab `#army-tab` after
  `#buildings-tab`, panel `#army-panel`). Wired in `src/game/GameScene.js` (`armyPanel`, updated twice a second).
- Orders are the existing unit commands: Guard = `UnitCommands.hold` / `move` (right-click on the map with the map
  selection, which the panel sets), Patrol = `resume`. Nothing new is saved.
- `src/systems/MilitarySystem.js`: `patrolRoute()` (walkable waypoints on a ring two tiles outside the box of all
  finished buildings, every four tiles; cached until buildings change) and `nextPatrolPoint(worker)`.
  `src/systems/WorkerAI.js`: `patrol` walks it. `src/data/military.js`: `PATROL`.
- `src/game/TerrainRenderer.js`: the tile outline in `liftChunk`.
- Texts `army.*` in `src/i18n/cs.js`, `en.js`; styles in `src/style.css`; test in `tests/military-units.test.js`.

## Implementation decisions
- **Not done from the spec:** walking on top of walls and standing on top of a tower (residents cannot climb walls in
  the game yet; a Guard stands beside the tower), a click-on-the-map button for the guard post (the right mouse button
  does it), night shifts, more sight or range from a tower.
- The round follows the settlement's bounding box, so it runs outside walls that enclose the buildings and inside
  walls built further out.
- `SAVE_VERSION` stays: a Guard is a saved `Holding` command; the place on the round is found again after a load.

## Save/Load impact
None.

## Testing
- `npm test`: 1261 pass. Headless Chrome: the tab opens, two soldiers chosen with Shift, Guard holds them; screenshot
  of the start checked for the terrain after the fix.

## Notes for the next agent
- Look at a screenshot after every change of `liftChunk`: unit tests cannot see it and the smokes run with the lift off.
- No browser smoke covers the Army tab.
