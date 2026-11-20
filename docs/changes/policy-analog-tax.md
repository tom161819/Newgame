# Owner 19 Nov 2026 – analog tax slider; the tax line follows the slider

## What and why
The owner reported (with a screenshot) that moving the tax slider did not change the shown Gold per resident or the daily total, and asked for a smooth slider instead of a few levels. The line showed the rate in force today, while a new rate is pending until the next morning (Policy v2 P1).

## Files and systems
- `src/data/policy.js`: `TAX_RANGE` (0–1.5, step 0.05), `normalizeTax`, `validTax`, `taxHappiness` (linear between the named `TAX_RATES` anchors), `taxLevel` (nearest anchor, ties to the lower one); `DEFAULT_POLICY.tax` is 0.5.
- `src/systems/PolicySystem.js`: `tax` and `pending.tax` are numbers; `set('tax', …)` takes a number or a level name and snaps it; target, taxes, unpaid and hungry-tax penalties use the number (the hungry-tax rule applies where the slider reads High or Very high).
- `src/ui/PolicySliders.js`: a separate analog tax slider (keys and wheel move 0.05); name "<level> · 0.75" and the nearest level's icon. Rations unchanged.
- `src/ui/PolicyPanel.js`, i18n: the tax line shows the chosen rate, with "From tomorrow" while it is pending; the pending line shows the amount.
- `src/systems/GameStateSerializer.js`: tax values validated as numbers on the step.

## Implementation decisions
- Happiness keeps the owner's old anchor values (+10, +5, 0, −10, −20) and interpolates between them, so existing balance stays the same at the old levels.
- The change still takes effect the next morning (no tax dodging around dawn).

## Save/Load impact
SAVE_VERSION 65 → 66: `policy.tax` and `policy.pending.tax` are numbers. Saves of 65 are rejected (alpha policy); a new game is needed.

## Testing
The test fixture `tests/fixtures/saves/village-0.91.0.json.gz` got schema 66 and a number tax, as in earlier bumps. `tests/policy.test.js` (updated for numbers, new analog test), `tests/policy-sliders.test.js`, `tests/king-xp.test.js`, full `npm test`, build; browser smokes `policy` and `side-cards` updated.

## Notes for the next agent
Level names (`policy.tax.<level>`) are only labels now; anything new should read `policy.tax` as Gold per resident.
