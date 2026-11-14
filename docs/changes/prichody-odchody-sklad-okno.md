# Arrivals and departures rework; stale Building store section

## What and why
- Owner, 14 Nov 2026: newcomers come too slowly even at Attractiveness 100 %, and almost nobody leaves when things go badly.
- Owner, 14 Nov 2026: the Quarry window showed "Building store" twice; the second one held 20 Wood that nobody carried away.

## Files and systems
- `src/data/jobs.js`: `POPULATION.migrantsPerResidents`, `migrantsMaxPerDay`, `migrantsPerDay(residents)`.
- `src/systems/WorkerSystem.js` `onNewDay`, `src/systems/DevTools.js` `arrivalForecast`: use `migrantsPerDay(residents)`.
- `src/data/needs.js` `DISCONTENT`: strike below 35 for 2 days, ends at 50; leaving below 25 for 2 days.
- `src/i18n/*.js`, `src/systems/Discontent.js`: texts follow the numbers.
- `src/ui/WorkplacePanel.js` `destroy`: removes `#farm-store` and `#own-store`.

## Implementation decisions
- Arrivals stay one roll per newcomer with the Attractiveness chance and the old blocks (beds, food under two days, more than three without work). Only the number of rolls a day grows with the settlement: 1 + residents/10, at most 5.
- Departures keep the per-resident rule; only the thresholds moved. A kingdom-wide rule was not added.
- The second "Building store" was not a second pile. Each `WorkplacePanel` adds its own section to the shared dialog and `destroy` forgot two of them, so the section of the previous game stayed in the page, frozen.

## Save/Load impact
None. No new fields; SAVE_VERSION stays 62. Saved `lowDays`/`criticalDays` counters are read against the new thresholds from the next day end.

## Testing
- Full suite `npm test`.
- Not played in a browser.

## Notes for the next agent
- The owner may still find arrivals slow or departures harsh; the numbers are in `POPULATION` and `DISCONTENT`.
- A pile fills when the miner carries the stone to it, not at the moment the mining bar ends.
