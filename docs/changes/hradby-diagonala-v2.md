# Diagonal wall pieces v2: as thick as the straight wall, gap-free joints

## What and why
Owner 15 Nov 2026, 04:34, after seeing v1: "ať je ta zeď diagonálně stejně opticky široká jako když je původně, a ať na sebe navazují přechody". v1 was 0.62 tile thick and ended at the tile corners.

## Files and systems
- `studio/src/generators/wallkit.js` – `DIAGONAL` now `{thickness: 1, reach: 0.5, merlons: 4}`; `diagonalLocal()` rewritten.
- `art/assets/buildings/wall-diagonal/asset.json` – footprint 3 × 3 (the piece is longer), variants version 2; sprites v2.
- `art/assets/buildings/wall-kit-preview/asset.json` – the two diagonal previews version 2; sprites v2.

## Implementation decisions
- **Thickness 1 tile**, the same as the straight wall block. On screen the run down the screen is 43 px wide, the run across shows a full-height face.
- **Reach 0.5 tile past each tile corner.** Neighbouring pieces overlap into one band; at the end of a run the band runs into the straight block until its sides meet the block's sides, so there is no notch or gap at the joint.
- **Merlons** only on the piece's own tile diagonal, four per tile at fixed places, so overlapping pieces show one even row. The low parapet wall runs the whole length (identical where pieces overlap).
- On the branch `diagonal-walls` (game side, still not released): the new origins, and a diagonal piece keeps its baked shadow in the body (split off, the parapet shadow on its own walk would leave holes).

## Save/Load impact
None.

## Testing
Studio tests, full suite (also on the branch). Browser harness /tmp/perfdiag/wd.mjs on the branch: a run down the screen and one across, both between straight blocks.

## Notes for the next agent
Release the branch only after the owner approves `wall-diagonal` v2.
