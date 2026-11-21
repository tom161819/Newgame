# Take-over of the Studio decisions on bushes, shrubs and thickets

## What and why
Owner 21 Nov 2026: "ano převezmi je, nasaď ty nový keře do hry". The Studio database held about 600 decisions; 448
of them (the owner's Blender bushes, shrubs and thickets in 4 seasons × 4 views, 16 Nov) and a few older ones
(Castle, Fountain and Well rotations, diagonal wall previews) had never been written to `art/approvals.json`.

## Files and systems
- `art/approvals.json` via `npm run studio:sync` (546 decisions, 0 ignored). The documents were rebuilt from the
  database listing; version and specHash come from each variant's current export (all checked equal to the
  database).
- `scripts/export-nature-art.mjs` re-run: `public/assets/nature/nature-atlas.v2.png` and `src/data/natureArt.js` now
  hold only approved frames. The old generated shrub looks (`shrubs`, `shrubs-seasons` v1) are gone: their v2 (the
  Blender renders) was decided with only Hazel small and Hazel spring chosen. The bushes in the game come from the
  bush atlas (0.145.1), so nothing visible changes.
- Decoration bushes (`bush_meadow`, `bush_berry`, `bush_flowering`, `bush_scrub`): sprites v1 → the approved v2 (the
  owner's Blender renders); origin and visual height from the export metadata.
- `tests/nature-art.test.js`: the atlas frame count floor 90 → 60.

## Implementation decisions
- Decisions already in the repository (66) were not rewritten; their database documents were deleted with the rest.

## Save/Load impact
None.

## Testing
- `npm test`; Studio database documents deleted only after the release.

## Notes for the next agent
- Many seasonal views were recorded as "Not chosen" (the Studio rejects the other variants when one is chosen for
  the game); the bush atlas still shows all 448 renders as agreed on 17 Nov. Ask the owner before dropping any.
