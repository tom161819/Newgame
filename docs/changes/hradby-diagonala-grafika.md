# Diagonal wall pieces in the Asset Studio (point 41, art only)

## What and why
Owner 14 Nov: a wall dragged diagonally makes steps (Z); he wants two diagonal tiles joined by one line of wall. 15 Nov: "41 - připrav je ty" (Claude prepares the art). This change adds the art to the Studio for his review. The game is unchanged.

## Files and systems
- `studio/src/generators/wallkit.js` – `piece: 'diagonal'` with `run: 'se' | 'ne'` (`diagonalLocal`, `DIAGONAL`), and `diagonals` in `assembly`.
- `art/assets/buildings/wall-diagonal/asset.json` (new asset, footprint 2 × 2) and `art/sprites/wall-diagonal/*`.
- `art/assets/buildings/wall-kit-preview/asset.json` – previews `wall-kit-preview-diagonal` and `-diagonal-across`; sprites exported.

## Implementation decisions
- One tile of a diagonal run is a wall from corner to corner of the tile, turned 45°, 0.62 tile thick, as tall as the block (68 px walk), parapets on both long sides. It is 0.24 tile longer than the tile's diagonal, so neighbouring pieces overlap into one wall and the end reaches into the corner of a straight block.
- The pieces are their own asset with a 2 × 2 footprint: the Studio validator does not allow a part outside the footprint, and a turned wall leaves a 1 × 1 tile at its ends. The game must draw them on the **tile centre** (export `origin`), not on the front corner.
- No approval record was written. The owner asked Claude to prepare the art; he has not seen it yet.

## Save/Load impact
None.

## Testing
Studio tests (59 pass), full suite, Studio smoke.

## Notes for the next agent
The mechanic is prepared on the git branch `diagonal-walls` (not released): `wallLine` without steps, `diagonalRun`, wall walk across corners, `FortificationView` drawing the pieces. Merge it after the owner approves the two `wall-diagonal` variants (then add them to `APPROVED_WALL_ART` with the approval record from the Studio).
