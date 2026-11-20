# Resource +/− without building and hand collection (owner point 85)

## What and why
Owner, 20 Nov 2026 (his point 84): the +/− by the resources should not count building costs and hand collection; with them it is hard to see where there is a shortage and where a surplus.

## Files and systems
- `src/ui/resourceEconomy.js` — `OUTSIDE_BALANCE`, `outsideBalance(source,income)` and `operatingNet(summary)`; `dailyResourceLabel` and `dailyResourceTone` (the number and its colour in the resource bar) use it.
- `src/ui/ResourceEconomyTooltip.js` — under the day's summary a line "In the bar (without building and hand collection): X"; the full list of sources and the full net change stay.
- `src/i18n/en.js`, `cs.js` — `economy.operating`.

## Implementation decisions
- Left out: expenses "<building> Construction", "<building> Cancellation Loss", "Castle Upgrade"; income "Construction Refund", "Demolition Refund", "Stone Collection", "Resource Collection" (a resource clicked and picked up by hand).
- Workers' production (Woodcutting, Mining, Farming …), consumption, trade, wages and taxes stay in.
- The ledger itself and the save are unchanged: only the display filters.

## Save/Load impact
None.

## Testing
New `tests/resource-balance.test.js`; `tests/resource-ledger-integration.test.js` now expects hand collection to stay out of the bar.

## Notes for the next agent
A new building-related ledger source should end with " Construction" or be added to `OUTSIDE_BALANCE`.
