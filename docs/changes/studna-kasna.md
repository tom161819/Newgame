# Well art and the new Fountain

## What and why
Owner, 14 Nov 2026 (Mechaniky chat, eight renders): add the Well art (1×1) and a new building, the Fountain (2×2, Housing); cut the ground patch so they connect to the terrain or the paving under them.

## Files and systems
- `art/assets/decorations/well/asset.json`: variants `well-render-0…270`. New `art/assets/decorations/fountain/asset.json`: `fountain-render-0…270`. Sprites in `art/sprites/well|fountain/`.
- `art/approvals.json`: `well` and `fountain` prefer `*-render-0`.
- `src/data/objects/approvedArt.js`: `well`, `fountain`; PNGs in `public/assets/buildings/well|fountain/`.
- `src/data/children.js` `HOUSE_DECORATIONS.fountain {range:8,happiness:2}`; `src/data/objects/housing.js` definition `fountain`.
- `src/systems/ChildrenSystem.js` (`decorBonus`, `surroundings`), `NeedsSystem.status().fountain`, `src/ui/NeedsDisplay.js`, `src/systems/NightThreatSystem.js` (water source), `src/game/buildings.js` (may stand on paths and paving).
- i18n: `object.fountain.*`, `needs.fountainLine`, `wiki.text.building.fountain.*`.

## Implementation decisions
- Ground cut: pixels with warm saturated colour (dirt, grass; saturation over 0.36) connected to the outside are removed, loose pebbles go with them; the grey stone stays. Then height × 0.88 (the renders are steeper than the game's view), the usual grade, scale 0.12 (Well) and 0.145 (Fountain).
- The game uses the 0° view. The other three views are in the Studio, not reviewed.
- The approval records carry the note that the owner asked for it in the chat, not in the Studio.
- With the art the Well is drawn by `SpriteBuildingView`; `DecorationView` remains the fallback when the picture cannot load. The Well's winter snow roof of the provisional drawing is gone.
- The Fountain's numbers (+2 within 8 tiles, 20 Stone + 2 Wood) are a first guess.

## Save/Load impact
None. A new building type only; SAVE_VERSION stays 62. Older saves show their Wells with the new art.

## Testing
- `tests/children.test.js` (new Fountain case), `tests/assets.test.js`, `tests/building-categories.test.js`, `tests/housing.test.js`, Studio tests; full suite.
- Browser (headless Chrome): Well and Fountain on grass and on paving, screenshot checked.

## Notes for the next agent
- `/tmp/fit/import2.mjs` (workspace only) imports into `art/assets/<dir>/` and can borrow the template of another asset.
- vite build fails with exit 2 when the outDir already holds `assets/` (cp with errorOnExist): delete the outDir first.
