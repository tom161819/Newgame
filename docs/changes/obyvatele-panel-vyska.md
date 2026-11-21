# Population panel: full height, no Soldiers group

## What and why
Owner 21 Nov 2026: the Population panel should reach from the top bar to the bottom of the page so more residents
fit than two; the Soldiers group is dropped because the Army panel already lists the soldiers.

## Files and systems
- `src/ui/PopulationSidebar.js`: `fitHeight()` puts the panel's top 8 px under the top bar when it opens and on
  resize; the Soldiers group (`#population-soldiers`, `renderSoldiers`) is removed; the Haulers box now follows the
  needs line directly.
- `src/style.css`: the panel runs to 12 px above the bottom (no max height); the resident list takes the free height
  (at least 180 px).

## Implementation decisions
- The `population.soldiers*` texts stay in the dictionaries for now (unused).

## Save/Load impact
None.

## Testing
- `npm test`; browser 1280 × 800 (list 290 px, was 2 rows of space) and 400 × 860.

## Notes for the next agent
- `scripts/soldiers-smoke.mjs` still looks for `#population-soldiers`; point it at the Army panel.
