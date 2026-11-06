# #114 – Workplace porch and seating concepts in the Asset Studio

## What and why
[#114](https://github.com/tom161819/Newgame/issues/114) is the art half of step 71. When idle, workers sit in front of their workplace. The mechanics are Codex's #98, which uses a placeholder porch. This change puts real concepts into the existing Asset Studio for the owner to choose from:
- 2–3 alternatives of a shared construction;
- profession-themed versions for buildings that exist in the game;
- seats for 1, 2 and 3 or more workers.

Nothing enters the game until approved.

## Files and systems
- `studio/src/generators/props.js`: new props `bench`, `stool`, `table` and `basket` (bread). The seat tops are at about 0.17, the height a seated figure needs. No existing prop changed.
- `art/assets/decorations/workplace-porch/asset.json`, the shared construction:
  - open veranda (2 seats);
  - awning with a table (3 seats);
  - plain bench (1–2 seats).
- `art/assets/decorations/trade-porch/asset.json`, the trade versions:
  - Mill: grain sacks, 2 seats;
  - Bakery: table with bread baskets, 2 seats;
  - Quarry: stone blocks as seats, 3 seats;
  - Smelter: bench by the anvil, 1 seat.
- Every variant's spec lists `seats: [[x, z], …]` in tile units, so #98 can place seated workers exactly.
- `art/sprites/workplace-porch/*`, `art/sprites/trade-porch/*` (exported) and `art/approvals.json` (all `review`).
- The branch includes #199 (`claude/builder-workshop-art`) for the `shed` body kind. **Merge order: #199 first, then this PR.**

## Implementation decisions
- Footprint 2 × 1: a strip along the building's front, meant beside the door, not on it, so entrances and carriers stay free. The work faces the camera, and roofs are light lean-tos or awnings that do not hide seated workers.
- Decorations use the workshop recipe and the same materials and lights as the approved buildings, so the style matches.
- `seats` is data only; the generator ignores it. The anchor model for #98 is documented here and in the asset descriptions.

## Save/Load impact
None.

## Testing
- `npm test` passes (754), including the studio spec, footprint and sprite-hash checks.
- `npm run studio:smoke` passes (14 PASS lines, no console errors, Canvas/WebGL demo, 390 px phone).
- The exported sprites were inspected visually.

## Notes for the next agent
- After approval, a follow-up integration issue swaps #98's placeholder for the approved porch and uses the `seats` anchors. Seated animations are not part of this.
- Future buildings (Master 11–15) were not drawn as finished trades.
