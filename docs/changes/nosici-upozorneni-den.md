# "Goods wait, set Carries first" after a day

## What and why
Owner 19 Nov 2026 (screenshot of the Notices bar: "Dřevorubecká chata: Dřevo čeká déle než 2 hodiny…"): "this should already have been changed to one day – why are there still hours?" No earlier change of this threshold is in the repository or the plan; the notice still fired after 2 game hours.

## What changed
- `PILE_WAIT_HOURS` 2 → 24: the `pileWaiting` notice comes only when goods have waited a whole game day in a producer pile or output while Haulers carry other things.
- Texts: "čeká déle než den" / "has waited over a day".

## Files and systems
`src/systems/ProductionDiagnostics.js`, `src/i18n/cs.js`, `src/i18n/en.js`; test `tests/logistics-haulers.test.js`.

## Implementation decisions
- Kept in game hours (24 = one day at any day length) so the constant reads the same as before.

## Save/Load impact
None – the waiting time is not saved (it restarts after loading, as before). SAVE_VERSION unchanged.

## Testing
- `tests/logistics-haulers.test.js`: no notice at once nor after 2 hours, notice after a day, gone when the goods are taken.
- `npm test`.

## Notes for the next agent
- Browser smoke: no (threshold and text only).
