# Diagonal wall pieces v3: elbows, smooth joints, merlons only on the outer edges

## What and why
Owner 15 Nov 2026, 04:59, after v2: "přechod musí být hladký, nejlépe tam vlastně nemá být vidět žádný přechod, stejně tak cimbuří má být jenom na krajích a ne uprostřed". In v2 the band overlapped the straight block and the block's own parapets crossed the wall at the joint.

## Files and systems
- `studio/src/generators/wallkit.js` – `diagonalPiece` (band corner to corner, parapets on both sides), `elbowPiece` (block + half band towards a corner, the two block sides at that corner cut where the band leaves), `bandBody`, `bandParapets`, `parapetPart`, `elbowSides`; assembly `elbows`.
- `art/assets/buildings/wall-diagonal/asset.json` – variants v3: `diagonal-se`, `diagonal-ne`, `elbow-ne|se|sw|nw`.
- `art/assets/buildings/wall-kit-preview/asset.json` – the two diagonal previews use elbows (v3).

## Implementation decisions
- A run has three kinds of tile: middle (pure band), end (elbow: one piece, so no overlap of two sprites and no crossing parapet) and the straight wall beside it (kit, unchanged). The band and the elbow meet at the tile corner with the same cross-section.
- The parapet follows the outline: block side → 45° bend at EDGE·(√2−1) from the side's middle → along the band. Rails overlap 0.05 at the bend.
- Merlons along the band at fixed places (every √2/4 from a tile corner): four on a middle tile, one on an elbow arm, so the row is even across pieces.
- Branch `diagonal-walls` (not released): `wallShape` → `{diagonal}` / `{elbow}` / null; FortificationView draws the elbow and only the kit parapets of the other two open sides; shadows are split like the kit again (v2 kept them in the body, which darkened the neighbouring pieces).

## Save/Load impact
None.

## Testing
Studio tests; full suite on main and on the branch; browser harness /tmp/perfdiag/wd.mjs on the branch.

## Notes for the next agent
Release the branch only after the owner approves `wall-diagonal` v3.
