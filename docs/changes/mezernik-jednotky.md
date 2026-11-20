# Space: people on towers and walls on the ground plan; tower doors on slopes (owner report 20 Nov 2026)

## What and why
Owner, 20 Nov 2026 (screenshots): keep the 2 × 2 Gate (his choice 2); the walls join the Tower badly; and with Space the soldier on a Tower still stands in the air – he should be shown on the Tower's ground plan (the same for the Castle and the Gate).
In the flattened view the soldier, the doors from the walls into the Tower and the building's warning icon stayed at their old height. At the joint, the door drawn in code sat at the height of the Tower's face; on sloping ground the wall is drawn at the height of its own front corner, so the door sank into the wall walk (or floated above it).

## Files and systems
- `src/game/buildings.js` — `FLAT_VIEW` flag; `towerTop` gives the building's own tile while it is on, so everyone placed by it (soldiers and the King on walls, Towers and Gates via `WallPatrol.place`, enemy archers via `EnemyArmy.place`, the climb) stands on the ground plan.
- `src/game/FlatBuildings.js` — sets the flag, refreshes the tower doors and the warning icons on toggle.
- `src/game/TowerDoors.js` — doors are hidden in the flat view; a door's height follows the front corner of the wall leading to it (the lift of the face replaced by the lift of the wall's corner).
- `src/game/IssueIcons.js` — a building's warning icon stands on the ground in the flat view.

## Implementation decisions
- Only drawing changes: positions, paths and the wall walk stay as they are.

## Save/Load impact
None.

## Testing
New `tests/flat-view-units.test.js` (the flat top of a Tower is its tile; a door on a slope keeps the wall's height). Browser: a Tower with walls on four sides and an Archer posted on it – Space shows the Archer on the Tower's plan and no doors in the air.

## Notes for the next agent
If the owner still sees a bad joint between walls and a Tower on flat ground, ask him for its place: the doors are provisional code drawings (TOWER_DOOR) until the Tower art has its own.
