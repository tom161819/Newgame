# Kingdom overview hover: bonuses in rows

## What and why
Owner 21 Nov 2026: the hover panels over the Kingdom overview should list the single bonuses one under another,
like the Kingdom Policy window – tidy and easy to read – instead of one long sentence.

## Files and systems
- `src/ui/KingdomOverview.js`: `tipRow(label, value)` writes a line `label<TAB>value`; `tipParts` turns it into a row
  (`{row, tone}`: green for +, red for −) and `GameTip` draws it as label left, value right. Happiness lists Food,
  Rest, Housing and Safety with their weight and their points, then Other; Attractiveness lists Base and each factor;
  Safety lists Base, near the Castle, near a tower, near a guard, the day after an attack.
- `src/style.css`: `.game-tip-row`. en/cs texts (`explain.part.*`, `explain.safety.*`).
- `tests/kingdom-overview.test.js`.

## Implementation decisions
- Lines without a tab keep their old look, so other hover texts are unchanged.

## Save/Load impact
None.

## Testing
- `npm test`; browser: the Happiness and Safety panels show the rows (values on the right, coloured).

## Notes for the next agent
- Other hover texts can use `tipRow` the same way.
