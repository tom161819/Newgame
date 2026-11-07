# Kingdom policy: taxes and food rations (#103, 7 Nov 2026)

## What and why
Owner request AUD80–81 (plan item `m-103-dane-a-pridely`): tax rate and food rations in the Castle panel, tied to residents' needs and Happiness (#58). The plan item had no brief; the values below were chosen in the original chat and written to the plan item.

## Files and systems
- `src/data/policy.js`: `TAX_RATES` (none 0 / low 0.25 / normal 0.5 / high 1 / very high 1.5 Gold per resident per day; Happiness +10 / +5 / 0 / −10 / −20), `RATIONS` (small 0.5 / normal 1 / generous 1.5 portions a day; Happiness −15 / 0 / +10), defaults normal/normal.
- `src/systems/PolicySystem.js` (`scene.policy`): `set`, `portions`, `happiness`, `dailyTaxes`, `collect(day)` on `gameTime.onNewDay` (only while a finished Castle stands; ledger source "Taxes", id `taxes:<day>`), export/import.
- `FoodSystem.advance`: residents (not the King) eat `policy.portions()` per day. `NeedsSystem.status`: Happiness = needs − unpaid penalty + policy bonus (`policy` field in the status). `WageSystem.overview`: income includes taxes.
- `src/ui/PolicyPanel.js` + markup in the Castle (`#employment-panel`) panel: two selects with effect lines.
- Save: `SAVE_VERSION` 40, `policy: { tax, rations, lastTaxDay }` validated.
- `GameApplication`: Getting started now opens only from the setup's `onStart` (it also opened on scripted `app.start()`, which blocked the ledger smoke).
- Smokes: new `scripts/policy-smoke.mjs` (`--policy`); `ledger-smoke` expects the 0.9.2 Gold format and taxes; `farmer-establishment` and `farm-plots` press Escape after placing a Wheat Field (its tool stays selected since 0.9.1). These smokes had not been run since those releases.
- i18n `policy.*`, `ledger.Taxes`; tests `tests/policy.test.js`.

## Implementation decisions
- Taxes are per resident (so income grows with the village and can pay the ~1 Gold/day wages); Normal is the default, which adds 0.5 Gold per resident per day to the earlier fixed Castle income of 5.
- Rations change only how often residents eat; the Food need itself works as before. Their Happiness effect is a flat bonus/penalty like taxes.
- #58 phase C2 (needs reacting to policy in more detail) can build on `policy.happiness()` and the `policy` field of a resident's status.

## Save/Load impact
New schema 40 (minor 0.12.0).

## Testing
`npm test` passes (838). Smokes `--policy`, `--ledger`, `--needs`, `--employment`, `--castle-gathering` and batches of 30+ other scenarios pass.

## Notes for the next agent
- Show the policy effect in the resident panel's Happiness breakdown when #58 C2 is done (`status.policy`).
