# Formations with a blueprint, Test map lands, stand-still moves (0.143.6)

## What and why
Owner 17 Nov 2026: (1) fifty standing soldiers all alike look unnatural – small moves; (2) the Test map should offer the land: the home map with the Castle or the lands found by scouting; (3) basic formations, and holding the mouse button while giving the move order shows a blueprint of the future places that turns with the mouse and is placed on release.

## Files and systems
- `scripts/blender/render-soldier.py`: five stand-still frames (`fidget`, columns 19–23; `--from` renders only new columns); `pack-soldier-sheets.py` writes `anim.idles`. `approvedArt.soldierIdle` picks a move for 0.9–2.7 s after 1.5–10 s of standing, per figure (`HumanView.idleState`, game time).
- `src/game/formations.js` (pure): `formationShape`, `formationOffsets` (√2 steps on diagonals), `formationTiles` (nearest free walkable tile), `assignFormation` (armour front, archers back, men keep their side), `FORMATIONS`.
- `UnitCommands.move(workers, target, {formation, facing})`: a man's first choice is his formation place; `worker.holdFace` (not saved – the save keeps only state and goal of a command) turns him and sets `direction` on arrival.
- `UnitSelection`: formation buttons (2+ chosen); the right button now gives the move on release; while held, `drawOrder` shows the places and an arrow; dragging over 14 px sets the facing (worldToGrid of the drag).
- Test map: `SANDBOX_LANDS`, `sandboxLand`, `sandboxSettings(land)` (zone world code, 100×100, no Castle), `GameScene.land = zone ?? sandboxLand` drives shaping, trees, deposits and the Castle; `populateFeature` (from `populateZone`) gives the camp, chests, rats and mine mouth; the main menu shows a land dialog (`chooseTestLand`).

## Implementation decisions
Default formation is the block (keeps the group tight, like the earlier compromise). A plain right click faces from the group's middle to the target. The King's order still goes on press.

## Save/Load impact
None (formation facing and stand-still moves are looks only).

## Testing
tests/formations.test.js, tests/soldier-anim.test.js; npm test; browser: land dialog → bandit camp with guards, 12 soldiers dragged into a block facing N, all hold facing N.

## Notes for the next agent
More formations: add a shape in `formationShape`. The facing arrow is 2.2 tiles long. Test map lands use `zoneById('sandbox')` → the default east offset for the feature.
