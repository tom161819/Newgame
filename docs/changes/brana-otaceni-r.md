# Gate: R always turns it, walls join it

## What and why
Owner 20 Nov 2026 (screenshots): "R either does not turn the Gate, or when it does the Gate is built differently, and the walls
that should join it are drawn wrong."
- On a wall run R was locked ("The Gate follows the wall here"), so a Gate the run oriented wrongly could not be fixed.
- A 2 × 2 Gate counted any wall touching a side, also a wall running past it (parallel to the side). Such a wall turned
  the Gate across the real run, so walls ran into its gateway.
- Walls ending at a Gate kept their end merlons on the Gate side; they stuck out of the joint.

## Files and systems
- `src/game/walls.js`: `gateAxis` (2 × 2) counts a side wall only if it leads away from the side or is a stub; `wallLayout`
  links a wall to a finished Gate on the Gate's wall sides (E/W for axis `x`, N/S for `y`), visual only.
- `src/game/GameScene.js`: `rotateGate` – where the run decides, R flips the axis for that tile only (`gateFlipAt`);
  `gatePlacementAxis(anchor)` is used by the preview and by the click, so both agree.
- `tests/walls-2.test.js`: parallel run does not decide; wall joins at the Gate's wall side, not at the gateway.

## Implementation decisions
- The flip is tied to the tile under the pointer: moving on gives the wall run its say again (repeat placement along a
  wall keeps following it).
- Point 48 stays: walls built later never turn a placed Gate.
- `status.gateFollowsWall` is no longer shown (keys kept).

## Save/Load impact
None. SAVE_VERSION stays 67; `connections` are recomputed on load.

## Testing
- Unit tests above; full `npm test`.
- Browser (test map): Gates on an E–W and a N–S run, R on a N–S run (preview and built Gate agree), a Gate beside a parallel
  wall stays free to turn.

## Notes for the next agent
- The Gate art is the 1 × 1 art drawn twice as big; a wall meets it on one of its two rows. A proper 2 × 2 gatehouse
  needs new art (Grafika).
