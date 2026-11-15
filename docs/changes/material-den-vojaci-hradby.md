# Material notice after a day; soldiers on walls, Gates and Towers (0.140.1)

## What and why
Owner 15 Nov 2026: (64) the notice that nobody brings material came after two game hours, he wants one day; (65) soldiers should have access to walls, Gates and Towers.

## Files and systems
- `src/data/diagnostics.js` (`materialNoticeDays:1`), `src/systems/ProductionDiagnostics.js` (the notice waits `dayDuration`). `materialWait` (30 s) still lets a Builder carry for himself.
- `src/systems/WallPatrol.js`: `postTiles` gives a Gate a platform post like a Tower; a soldier posted on a wall piece may climb at that piece; a post on a wall without Towers/Gates is no longer "no walls". `src/ui/UnitSelection.js`: a right click on the old 1×1 Gate posts soldiers too.

## Implementation decisions
"Patrol – walls" (moving between stops) still needs walls joined to a Tower or a Gate; only posts were widened. The King's climbing rules are unchanged.

## Save/Load impact
None (a Gate post is saved like a Tower post: {x, y, tower:id}).

## Testing
production-diagnostics test (no notice after materialWait, notice after a day); military-units test (Gate platform, lone wall climb); full suite.

## Notes for the next agent
If the owner meant passing through Gates on the ground, that is the gate's walkability, not this change.
