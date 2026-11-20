# Tower: no merlons in front of the doors

## What and why
Owner 20 Nov 2026 (screenshot): "the merlons around the Tower should disappear where a wall is, or at least in front of the
doors". Each wall touching a Tower drew its parapet on the Tower side, so a ring of merlons stood in front of the doors.

## Files and systems
- `src/game/walls.js` `wallLayout`: a wall next to a finished Tower is linked toward it on every side (as at a Gate's wall
  sides since 0.149.4). Visual only; `connections` are not used for walking.
- `tests/walls-2.test.js`: links at a finished Tower; an unfinished Tower keeps the merlons.

## Implementation decisions
- Only finished Towers; a blueprint still shows the wall's own end.

## Save/Load impact
None. SAVE_VERSION stays 67; `connections` are recomputed on load.

## Testing
- Unit test above; full `npm test`.
- Browser (test map): a Tower with two wall rows in front and walls on the sides – no merlons in front of the four doors.

## Notes for the next agent
- The wall walk now runs flush up to the tower face; the doors from TowerDoors sit on it.
