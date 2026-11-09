# Paths without circles: no wear from idle shuffling, areas only from soil

## What and why
Owner, 9 Nov 2026 (Grafika chat), with a screenshot from day 2:
- "pěšiny jsou taky nějaký broken / nahrál si tam do hry už poslední vybranou verzi (0)? proč tam jsou zase kolečka jako z prvních verzí?"
- The screenshot shows dark green and brown round patches around residents waiting near the Castle, and thin straight lines.

The game already uses the owner's only Path Lab proposal: `pathProposal/default`, version 2 from 8 Nov 22:26 (pesiny-v3, since 0.79.0).

## Cause
- IdleGathering moves residents without work, and Haulers, between waiting spots 2–4 tiles from the Castle every few seconds. Each step counted as a path walk.
- In a browser run of 0.83, 4 game days without input wore a 3 × 2 block to level 4 and wore trails around the Castle.
- The path geometry turned these blocks into round patches (worn areas and short capsules with a wide trampled border) and short straight lines.

## Files and systems
- src/systems/IdleGathering.js: an idle route of at most `IDLE_GATHERING.idleStepTiles` (10) tiles is stored as `worker.idleStep`.
- src/systems/PathWearSystem.js: `enter` skips an actor while it is still following that idle-step route (`actor.idleStep === actor.path`).
- src/data/idleGathering.js: new `idleStepTiles: 10`.
- src/game/pathV2.js + studio/src/path-lab/v2.js (kept the same): a tile belongs to an area only when a full 3 × 3 block of **soil** (level 2+) contains it, instead of any worn tile.

## Implementation decisions
- **Detect idle steps by the route itself.** Any new route, such as a task or a trip to work, replaces `worker.path`, so wear resumes on its own and needs no extra state.
- **Long walks to the Castle (over 10 tiles) still wear.** That is a real trip.
- **Keep the owner's style.** The Path Lab sliders are not touched.

## Save/Load impact
None. `idleStep` is not saved: after a load the rest of an idle step wears as before, which is negligible. Patches worn in older saves fade with the normal recovery.

## Testing
- tests/path-idle-wear.test.js:
  - an idle step wears nothing, but a new task route does;
  - a 3 × 3 block of level 1 is no area, a block of level 2 is, in the game and the Path Lab alike.
- Browser run, 4 game days without input:
  - 0.83.1: level-4 blocks and round patches by the Castle;
  - with the fix: 8 lightly worn tiles in the whole map and no round patches.

## Notes for the next agent
- Real paths still form from commutes, building, hauling and the king.
- If round ends of short isolated paths still bother the owner, look at `discs` (isolated tiles) and short chains in pathV2 geometry.
