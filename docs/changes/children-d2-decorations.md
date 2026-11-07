# Children and the Village Green D2: decorations by the houses

## What and why
Plan item `m-deti-d2-ozdoby` (brief `zadani-deti-naves.md`, part D2). The owner approved small decorations by the houses:
- **Swing Tree**: +1 for houses within 4 tiles; children swing on it.
- **Haystack**: only by a farm; children jump into it.
- **Well**: +1 for houses within 6 tiles; a function may come later.

## Files and systems
- `src/data/children.js`:
  - `HOUSE_DECORATIONS` with the ranges, bonuses, play kinds, play reach 8 and chance 0.35, and path level 2;
  - `SURROUNDINGS_CAP` = 8.
- `src/data/objects/housing.js`: `swing_tree`, `haystack`, `well` (1×1, Housing, `decoration` block, renderer
  `decoration`). Unlocks: the tree and the well need a completed House, the haystack a completed Farmhouse.
- `src/game/buildings.js` `placementError`:
  - decorations not on paving or path level ≥ 2 (`status.notOnPath`);
  - a Haystack within 6 tiles of a Farmhouse or Wheat Field (`status.needsFarmNearby`).
- `src/systems/ChildrenSystem.js`:
  - `decorations`, `decorBonus`, `surroundings` (green + family + swing + well, capped);
  - `decorationActivity` (play `swing` or `hay` on a free tile beside the decoration);
  - `playingAtDecoration`.
- `src/systems/NeedsSystem.js`: happiness uses `surroundings().total`; status has `swing`, `well`, `surroundingsCapped`.
- `src/ui/NeedsDisplay.js`: "Swing nearby +1", "Well nearby +1", and the cap line when the cap takes something away.
- `src/game/DecorationView.js`: provisional drawings with season looks (bare tree and snow in winter).
  `src/game/ChildViews.js`: the hay jump.
- `public/assets/buildings/{swing_tree,haystack,well}/*.svg`: menu icons. Translations in both languages.
- `scripts/house-decorations-smoke.mjs` (`--decorations`).

## Implementation decisions
- Decorations sit in the Housing menu: a new Decorations category would only hold three items.
- Today the cap cannot be reached above +8 (4 + 2 + 1 + 1 = 8). It is enforced anyway, so a later bonus (e.g. a cat at
  home, if it moves under "surroundings") cannot break it.
- In winter children do not go to the decorations (snow games stay as in D1).
- The Well has its own data block (`HOUSE_DECORATIONS.well`), so a later function (water for the Bakery, fire fighting)
  can be added there.
- Not done: adults stopping at the well. It is cosmetic and would need a new idle step in the residents' routine.
  It is left for the Well function.

## Save/Load impact
No format change: decorations are ordinary buildings, and the child activity is not saved (it is chosen again after
loading). SAVE_VERSION stays 55.

## Testing
- `npm test` (959 pass), with new children tests:
  - bonuses and the cap;
  - placement rules (farm, path, paving);
  - children play at the tree and in the hay.
- `npm run smoke -- --current-only --decorations`:
  - real menu placement;
  - the resident status shows +1/+1;
  - children play at the decorations;
  - screenshot.

## Notes for the next agent
- When the Studio art for the decorations is approved (g-deti-naves-grafika), switch the three definitions to
  `renderMode: 'sprite'` and keep DecorationView as the fallback, like the castle.
- Adults pausing at the well is still open (see above).
