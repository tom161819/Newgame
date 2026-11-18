# The owner's Blender bushes and thickets (0.145.1)

## What and why
Owner 17 Nov 2026: "keře by měli být schválený můžeš je nasadit?" – the bushes and thickets from Blender were approved in the Asset Studio (the `*-views` variants, Grafika bundle 0250). That bundle could not be read here (one 4.6 MB line), so the owner sent the render pack again on 18 Nov ("keře jsou zde", `Medieval_Kingdom_Kere_a_houstiny.zip`): 28 models × 4 seasons × 4 views.

## Files and systems
- `art/sprites/bush-renders/<model>/<season>-<angle>.png` + `sprite.json`: the pack's 1x game renders (tile 64 px wide) and their anchors; `README.owner.md` is the pack's readme.
- `scripts/export-bush-art.py`: packs all 448 frames into `public/assets/nature/bush-atlas.v1.png` and writes `src/data/bushArt.js` (`BUSH_ATLAS`, frame `<model>-<season>-<angle>`, origin = footprint centre on the ground).
- `src/game/natureArt.js`: a second atlas next to the nature atlas (`BUSH_KEY`); `natureReady` waits for both, `showNature` picks the atlas of the frame. `bushLook`: each tile keeps one model (species variant 1–3 or the matching decoration bush; the desert scrub has its own model now) and one of the four views all year, in its tile's season. `thicketLook`: hazel, bramble or mixed by the share of berry bushes, the tile season, a view per thicket; a long thicket (3 × 2, 2 × 1) only in views 000 and 180 so it stays on its footprint.

## Implementation decisions
- One atlas (2048 × 932, 2.5 MB) instead of 448 files: the published page has a 512-file cap.
- The older Studio bush looks stay in the nature atlas as the fallback if a frame is missing.

## Save/Load impact
None. Looks come from the tile and the season.

## Testing
`tests/nature-art.test.js`: every bush type gets a frame in each season with the same model and view all year; thickets by kind and season, long ones only in 000/180; the atlas has 448 frames and is a pixel copy of the renders. Browser: Test map, a 3 × 2 thicket and bushes in all four seasons.

## Notes for the next agent
New renders: replace the files in `art/sprites/bush-renders` and run `python3 scripts/export-bush-art.py`.
