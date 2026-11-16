# Party soldiers stay soldiers; a group keeps together; the drag box under the pointer (0.142.3)

## What and why
Owner 16 Nov 2026: "the soldiers became Unemployed on the new map"; "let the party or a selected group walk more together; when I drag to select, the box is sometimes elsewhere than the mouse".

## Files and systems
- `zoneMode.js`: a zone soldier's unit keeps `garrison: true`; without it `MilitarySystem.update` released the unit (no Barracks in a zone), spilled its gear and the resident looked Unemployed.
- `UnitCommands.move`: slots ordered by each unit's place in the group (offsets from the group middle squeezed to 2 tiles); `worker.groupPace` = slowest speed / own speed; `movement.js` applies it while `commandState.state==='MovingToHold'`.
- `UnitSelection`: the drag box is drawn in world space from `camera.getWorldPoint` (the scroll-free overlay was zoomed around the screen middle, so at zoom ≠ 1 it drifted from the pointer).
- `MilitarySystem.threat`: in a zone the soldier's own position is the guard centre. Bandit and Giant Rat have `gameplay.hostile` (right-click attack, `isEnemy`).

## Implementation decisions
Units still find their own routes (no leader-follow); same pace and kept places are enough to keep a small group together.

## Save/Load impact
None (`groupPace` is not saved; a loaded group walks at its own speeds).

## Testing
Unit tests; browser: party of 4 in a bandit land keeps soldier units and looks, drag box at zoom 1.6 matches the mouse rectangle and selects all 4, group move keeps them within a few tiles.

## Notes for the next agent
A leader-follow or formation path would keep groups tighter around obstacles.
