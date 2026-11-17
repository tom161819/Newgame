# Goal ring on walls, Towers and Gates (0.144.3)

## What and why
Owner 17 Nov 2026: "when I send them to a Tower, wall or Gate, show the ring where they should go, as on the ground." On the ground a selected unit with a move order shows a thin ring at its goal tile; a wall post had none.

## Files and systems
- `WallPatrol.postPoint(worker)`: the world point of a soldier's post. It is the wall tile or the Tower or Gate platform slot, raised by the same maths as `place()`, so the ring sits exactly where he will stand.
- `UnitSelection.draw`: for each selected soldier with a post, it draws the same thin ring there.

## Implementation decisions
The ring stays while the soldier is selected and has the post, like the ground ring stays while he holds his goal.

## Save/Load impact
None.

## Testing
tests/wall-access.test.js: the ring is raised above the wall tile and up on the Tower platform; once there, each soldier stands on his ring; no post means no ring. npm test.

## Notes for the next agent
The King's tower order keeps its own marker (`showMarker`).
