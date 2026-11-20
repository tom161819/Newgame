# A foreign caravan waits for its order a full day (owner point 78)

## What and why
Owner, 19 Nov 2026: "cizí karavana, co čeká na naložení, nesmí odjet, ale čekat aspoň 1 další den".
Before, a caravan with an order still being carried stayed only 0.25 day past its departure time, and an order nobody had picked up yet (status Pending) did not hold it at all.

## Files and systems
- `src/data/trade.js` — `CARAVAN_RULES.maxWait` 0.25 → 1 (days).
- `src/systems/TradeSystem.js` — `deliveryPending` is true for any open order of the caravan (Pending or Transporting).
- `src/systems/CaravanSystem.js` — comment only.

## Implementation decisions
- The caravan still leaves at once when the last order is done, so it does not idle the whole day.
- The 1-day cap stays, so an order that can never be filled does not keep the caravan forever.

## Save/Load impact
None. `waiting` and `departAt` were already saved; SAVE_VERSION unchanged.

## Testing
`tests/caravans.test.js` updated: the caravan is still trading 0.95 day after departure time and leaves after 1 day.

## Notes for the next agent
The countdown text "Leaving in {time} at the latest" already uses the longer time.
