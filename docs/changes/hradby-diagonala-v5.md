# Diagonal wall pieces v5: width of v3, mitred joints

## What and why
Owner 15 Nov 2026, 05:56, with a marked screenshot of v4: the diagonal walls are now wider; the width before (v3) was right; the teeth at the joints between the straight and the diagonal walls should go.

## Files and systems
- `studio/src/generators/wallkit.js` – `DIAGONAL.thickness` 1 again; `elbowPiece(corner, openZ, openX)`: the straight part is the tile minus the strip beside the band on each open side, the band starts at the mitre; parapets are found by probing the outline of the whole wall (`stretches`), so they follow it round the bend; `elbowFlags`; pure diagonal pieces overlap 0.04 past the tile corners.
- `art/assets/buildings/wall-diagonal/asset.json` – 2 diagonal + 16 elbow variants (v5); previews v5 plus `wall-kit-preview-diagonal-ends`.

## Implementation decisions
- The teeth were the tile corner beside the band: it stuck out past the band's edge. Where the side across from the band is open, that corner is now cut along the band's edge (mitre); where a wall joins there, the corner stays (the straight wall continues).
- An elbow piece carries all parapets of its tile, so the game draws no kit pieces there (16 variants: 4 corners × the two sides across open or joined).
- Branch `diagonal-walls`: `wallShape` returns `elbow: '<corner>-<z><x>'`; towers beside count as joined.

## Save/Load impact
None.

## Testing
Studio tests, full suite (main and branch); browser harness /tmp/perfdiag/wd.mjs on the branch.

## Notes for the next agent
Released game files will grow by 12 (18 diagonal pieces instead of 6) – the game artifact is at 494 of 512 files; consider an atlas for the wall pieces.
