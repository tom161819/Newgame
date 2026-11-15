# Carrying: Haulers carry twice as much, workers wait half a day for inputs

## What and why
Owner 15 Nov 2026, 05:04 (answer to the plan item m-noseni-zamestnanci): "nosiče udělej podle toho řešení v návrhu, půl dne, pak si dojde sám, udělej že nosič toho unese 2x víc než zaměstnanec". Haulers are the main carriers; a producer's worker fetches his inputs himself only when no Hauler came within half a day. Instead of wheelbarrows for Haulers, a Hauler simply carries twice the hand load.

## Files and systems
- `src/data/logistics.js` – `HAULER_LOAD_FACTOR = 2` in `loadCapacity`; `PRODUCER_WAIT {inputDays: .5, outputMs: 3000}`; `MAX_TRIP_UNITS` follows.
- `src/systems/LogisticsTaskManager.js` `waitForHauler` – inputs wait half a game day, outputs 3 s as before.
- Texts (cs, en): the Hauler descriptions.
- Tests: new `tests/noseni-zamestnanci.test.js`; carry amounts in carry-weights, haulers-food, logistics-construction, logistics-haulers, logistics-integration.

## Implementation decisions
- Outputs keep the short wait: a full output buffer stops the next batch, so the worker still carries his products out after a moment when no Hauler comes (as the owner asked on 14 Nov: when the building's store is full, the employee carries it).
- The wait only applies while a working Hauler can reach the building; without Haulers the worker goes at once (unchanged).
- The wait restarts with every batch (`nextCycle`), as before.
- The Logistics bonus (+2 units every 5 levels) and vehicles stay on top of the doubled hand load.
- Miners and woodcutters with a full pile already carry it themselves (`carryOwnOutput`); unchanged.

## Save/Load impact
None in the format. Saves validate a trip against `MAX_TRIP_UNITS`, which grew, so older saves stay valid.

## Testing
Full suite.

## Notes for the next agent
Balance to watch: with half-day waits a mill without a Hauler nearby is idle up to half a day per batch.

## Also in this release
- `studio/vite.config.js`: `assetsInlineLimit` 24 KB (was 16 KB). The 48 season oaks of 0.134.0 took the Studio build to 561 files; an artifact holds at most 512. Now 463.
