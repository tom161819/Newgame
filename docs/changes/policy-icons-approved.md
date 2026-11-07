# Kingdom Policy: approved tax and ration icons

## What and why
The owner chose the Studio icon sets on 7 November: tax coin stacks (`tax-icons-stacks`) and ration bowls
(`ration-icons-bowls`). Plan item `m-ikony-politika-vymena` replaces the provisional SVG drawn in PolicySliders (0.36.0).

## Files and systems
- `scripts/sync-policy-icons.mjs`: lists the chosen variant per kind and maps policy ids to file names (`very_high` →
  `very-high`). Running it writes `src/ui/policyIconsArt.js`.
- `src/ui/policyIconsArt.js` (generated): the SVG strings.
- `src/ui/PolicySliders.js`: `policyIcon` returns the approved SVG; the provisional drawing code is gone.
- `tests/policy-sliders.test.js`: each level matches its exported file, and the generated module is up to date.

## Implementation decisions
- The icons are inlined as SVG strings, not loaded as files: no extra request, no base-path problems in the artifact
  build, and the node tests can import them. The SVGs have no ids, so several copies on one page (Castle panel, Policy
  card, Granary) do not clash.
- The Studio also exports 40 px and 80 px PNGs; we do not need them because the SVG scales.

## Save/Load impact
None.

## Testing
- `npm test` (956 pass).
- `npm run smoke -- --current-only --policy --side-cards`: sliders still change the level icon (`data-icon`); a
  screenshot shows the new icons in the Policy card.

## Notes for the next agent
- After a new Studio pick for these icons, change the variant in `scripts/sync-policy-icons.mjs` and run
  `node scripts/sync-policy-icons.mjs`. The test fails if the generated module is out of date.
