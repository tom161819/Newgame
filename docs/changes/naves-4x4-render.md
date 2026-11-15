# Village Green 4 × 4 with the approved render

## What and why
Owner 14 Nov: "náves rozměr 4x4"; 15 Nov: all new graphics are approved, deploy them. The green is walkable ground, so the render cannot be one sprite sorted by depth: people cross it.

## Files and systems
- `src/data/objects/housing.js` – Village Green 4 × 4, `legacyFootprint` 3 × 3, `artSprites.render` (origin = the export's `baseOrigin`, the front corner).
- `src/data/children.js` – `VILLAGE_GREEN.art`: size, picture height and the three tall parts (polygon in picture pixels, y of the foot, tile).
- `src/render/artCutout.js` (new) – `cutoutKey`: a polygon of a loaded picture as its own canvas texture.
- `src/game/VillageGreenView.js` – `paintArt`: whole picture on the ground (depth −89), tree / bell / board cut-outs at the depth of their foot.
- `src/systems/ChildrenSystem.js` `greenTiles` – children and evening guests do not use the tree, bell and board tiles.
- Texts (cs, en), `public/assets/buildings/village_green/…png`, tests.

## Implementation decisions
- The picture is **not** in `APPROVED_BUILDING_ART`: that would switch the type to the generic sprite view and lose the green's own view (ground under people, reach circle, house outlines).
- The cut-outs are made at run time from the same texture, so there are no extra files to keep in step with the export.
- All 16 tiles stay walkable (as before); only the play/seat spots avoid the three tiles.
- Spring and autumn recolour the leaves like the oaks (`seasonTextureKey`). Winter shows the summer picture (no snow on the paving) until a winter render exists.
- A green with the old footprint (3 × 3, older saves) keeps the earlier procedural drawing; the render would not fit a 3 × 3 paved circle.

## Save/Load impact
None. Greens without `size` stay 3 × 3.

## Testing
Full suite; new test in `tests/children.test.js`. Browser harness /tmp/perfdiag/vg.mjs: green with people behind and in front of the tree and the bell, summer and autumn.

## Notes for the next agent
- If the owner sends other views of the green, `VILLAGE_GREEN.art.parts` must be measured per view.
- `tests/logistics-construction.test.js` "N02: the Builder carries only while no Hauler is free" failed once in a full run and passed six times alone: it is timing-sensitive under load.
