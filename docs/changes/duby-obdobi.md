# Oaks: the owner's season renders (48 views); diagonal wall v4 in the Studio

## What and why
- Owner 15 Nov 2026, 05:06: "tady jsou ty duby podle ročních období – 3 modely × 4 období × 4 směry, celkem 48 pohledů" (Medieval_Kingdom_Duby_obdobi.zip, Blender renders with sprite.json). They replace the summer-only renders and the run-time recolouring of 0.131.0.
- Owner 05:14, with a marked screenshot: the diagonal wall must be as wide as the straight one (the band down the screen as wide as a block, the band across reaching the front corners).

## Files and systems
- `art/assets/trees/oak-tree/asset.json` + `art/sprites/oak-tree/oak-tree-season-<look>-<season>-<view>.v1.*` (48 imported variants), approvals with the owner's message.
- `src/data/objects/approvedArt.js` `oak_tree` – 48 looks `<look>-<season>-<view>`; old render PNGs and the bare winter oak removed from `public/`.
- `src/render/treeSeasonTexture.js` `oakLook(natural, season, hash)` – season in the key; recolouring stays only for the Village Green tree.
- `src/game/TreeView.js` – no recolour, no winter scaling.
- `studio/src/generators/wallkit.js` – `DIAGONAL.thickness = √2`; elbows without cut side parapets; `wall-diagonal` and previews v4.
- Tests: oak-renders, asset-studio, assets (213 textures).

## Implementation decisions
- **Model mapping.** The pack's README: young and mature 1 × 1, broad 2 × 2. So pack `mature` → game `broad` (grown oak on one tile), pack `broad` → game `grand` (2 × 2).
- **Sizes stay as in the game** (young 45 px, grown 125 px, grand 195 px), scaled from each model's summer front view. The pack's own 1x versions are larger (young 130 px); the owner asked earlier for a young oak about as tall as a person.
- All four seasons of one view share the crop and the anchor (union of the four pictures), as in the pack.
- Diagonal wall: with thickness √2 the band's sides run through the side corners of its tiles. An elbow's band covers the two block sides at its corner completely, so those sides need no parapet and the outline bends at the block's corners.

## Save/Load impact
None.

## Testing
Full suite; Studio tests; browser harness /tmp/perfdiag/oak2.mjs (forest in four seasons).

## Notes for the next agent
The branch `diagonal-walls` must take the v4 origins (rebased after this release).
