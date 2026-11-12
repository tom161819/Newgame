# m-prehled-procenta-tooltip: the overview explains its percentages

## What and why
Owner, 12 Nov 2026 (3): hovering a value with % in the kingdom overview should show what moves it, how it is worked
out and a tip for improving it. Approved in the plan.

## Files and systems
- `src/ui/KingdomOverview.js`: `kingdomOverview()` adds `detail` (weighted parts of Happiness, what is left for taxes,
  wages, feast and surroundings, counts of hungry / tired / without a home / unsafe residents, free workplace seats).
  `overviewExplain(o)` turns it into lines per value; `render()` puts them into the rows' and chips' `title`.
- Texts `explain.*` in `src/i18n/cs.js`, `en.js`. Test in `tests/kingdom-overview.test.js`.

## Implementation decisions
- The explanation uses numbers the systems already give (average need statuses); nothing is worked out twice.
  "Other" is Happiness minus the four weighted needs, so the parts always add up to the shown value.
- A native `title` like the Attractiveness row already had. It does not open on touch; a tap panel is not done.
- The spec also named employment share, storage fill and days of food: the bar has no such rows, so they have no
  tooltip. Food days in the top bar keep their own text.

## Save/Load impact
None.

## Testing
- `npm test`: 1260 pass. Checked in headless Chrome that every row carries its text.

## Notes for the next agent
- No browser smoke hovers the rows.
