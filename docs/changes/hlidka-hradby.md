# Army order "Patrol – walls"

## What and why
Owner, 12 Nov 2026 (plan 21): soldiers should patrol the walls, stopping now and then at Towers and Gates.

## Files and systems
- `src/systems/WallPatrol.js` (new): `WALL_PATROL`, `wallStops` (finished walls touching a Tower or Gate),
  `canPatrolWalls`, `wallRoute` (breadth first over joined walls), `WallPatrol` (`set`, `update`, `leave`, `place`).
  A soldier walks on the ground to a stop, climbs, then walks from stop to stop (the one fewest others head for, far
  first) and waits 5–15 s there.
- `src/systems/MilitarySystem.js`: `this.wallPatrol`; `updateSoldier` lets the patrol lead; an Archer on a wall shoots
  threats in range.
- `src/game/WorkerController.js`: a soldier on the wall walk (`onWall`) moves along wall tiles and is drawn on top of
  the wall; anything else taking over (rest, death, another job) brings him down first (`wallGround`).
- `src/systems/VisibilityModifiers.js`: +3 sight on a wall.
- `src/ui/ArmyPanel.js`: order "Patrol – walls" (disabled with a reason without a wall beside a Tower or Gate); other
  orders end it. Texts `army.order.walls*`, `army.wallsNone`.
- Save: optional `workers[].wallPatrol` (true, soldiers only); a soldier on a wall is saved on the ground where he
  climbed (`serializeActor`) and climbs again after loading.

## Implementation decisions
- The wall walk is a chain of wall tiles; soldiers on it ignore ground navigation but nobody else can step there.
- Melee soldiers stay on the wall during a fight (only Archers shoot from it); the +2 Archer range is not added yet.

## Save/Load impact
SAVE_VERSION stays 62; optional `wallPatrol`.

## Testing
- `npm test`: a soldier climbs at a Tower, walks at least 6 wall tiles and is saved on walkable ground.
- Browser: a soldier drawn on the wall top between two Towers (screenshot).

## Notes for the next agent
- Grafika could add stairs at Towers; melee soldiers coming down to fight and the Archer range bonus are open.
