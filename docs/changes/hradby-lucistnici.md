# Archers on walls shoot and keep their posts (0.144.4)

## What and why
Owner 17 Nov 2026: "archers on the Tower, walls and Gate do not shoot at the enemy and leave their positions." There were four causes.
1. The wall branch of `MilitarySystem.updateSoldier` aimed only at enemies already attacking one of our people near the Barracks (`threat`).
2. A wall in the way blocked the line of sight, even for a shot from the height.
3. When it did shoot, it returned before `WallPatrol.update`, so `lastTick` went stale and `WorkerController` took him down after 1.5 s.
4. The soldiers' morning rest (night watch) and the "walk to the Barracks first" step took posted soldiers off the walls.

## Files and systems
- `CombatSystem`:
  - `WALL_ARCHER_RANGE` (2) is added to a ranged unit's reach while `onWall`.
  - From the height no line of sight is needed.
  - `inAttackRange` is used by both the combat tick and the targeting.
- `MilitarySystem.updateSoldier`:
  - An archer up there keeps a valid target, or takes the nearest visible enemy he can hit, and turns to it.
  - The patrol update always runs after that, so he never chases and his post stays fresh.
- `DailyRest.eligible`: not for a soldier on a wall order, the same as for a manual order.
- `WorkerAI`: a soldier on a wall order goes straight to the military update (no rest at home, no walk to the Barracks first).
- `WallPatrol`: `WALL_PATROL.archerRange` now refers to the same constant.

## Implementation decisions
A wall order acts like a manual order: the soldier holds it until the player gives another order. Soldiers on long wall duty therefore do not rest. Shifts could come later.

## Save/Load impact
None.

## Testing
`tests/wall-access.test.js`: an archer posted on the south wall hits a Raider 7 tiles outside, over the wall. After 20 s he still stands at his post, and he is not eligible for rest at home. `npm test`.

## Notes for the next agent
Melee soldiers on walls do not fight down from the wall (by design).
