# Asset Studio: Blender shrubs and thickets

## What and why
Owner, 15 Nov 2026: "zpracuj a přidej do asset studia nové grafiky keřů". The owner sent a pack (Keře a houštiny):
- 46 transparent replacements with the same names and pixel sizes as the Studio's shrubs, seasonal shrubs, thickets (2×1, 2×2, 3×2) and bushes;
- 28 Blender models × 4 seasons × 4 isometric views (the tree camera), at 1x game scale (tile 64 px wide), plus sprite.json with the shared anchor per view.

He wants shrubs on the map later to use the different views for variety, as the trees do.

## Files and systems
- **scripts/import-shrub-renders.py** (new):
  - Each of the 46 pictures becomes the next version (v2) of its variant, as a pre-made image (`baked`, source blender). The anchor comes from `original_map.json` `replacement_origin_px`, and the notes name the model, season and view.
  - Each model becomes a new asset `art/assets/nature/<model>-views` with 16 variants `<model>-views-<season>-<view>` (1x PNG + meta, shared anchor per view).
  - The generator and spec come from the matching drawn variant, which the Studio needs for every variant. Thickets use the season's own mix for autumn and winter.
- **scripts/stamp-baked-hashes.mjs** (new): writes the Studio's spec hash into the meta of pre-made images, so they are not reported as stale.
- art/assets and art/sprites: 6 changed assets, 28 new assets, 46 + 448 sprites.

## Implementation decisions
- **Only the 1x pictures.** The detailed renders are not in the Studio: the small pictures are inlined into the Studio scripts, which keeps it under the 512-file limit of a page.
- **The game is unchanged.** The new art waits in Review. Putting it into the game, with a random view per shrub, is a separate task once the owner approves.

## Save/Load impact
None.

## Testing
- npm test.
- studio:smoke passes, except the step "a design opened by link is scrolled into view in the list", which also fails on clean 0.140.1.

## Notes for the next agent
- The pack (Blender files, detailed renders) is not in the repo, because it is too big. The owner has it as Medieval_Kingdom_Kere_a_houstiny.zip.
- The Studio smoke failure about the linked design scroll is pre-existing (since at least 0.140.1).
