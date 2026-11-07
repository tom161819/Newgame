# Trade: Keep between, caravans with porters and guards, selling vehicles (m-obchod-vylepseni)

## What and why
Owner requests 7 Nov 2026 (points 25, 48, 57).

## Files and systems
- Keep between (25): automatic trade has a fourth mode `between` (buy below / sell above / max buy price / min sell
  price; `src/data/trade.js` `autoRule`, `effectiveAutoRule`). Below the low level it buys up to it, above the high
  level it sells down to it, never both; the sell level must be above the buy level (error `above`). Existing sell /
  buy rules stay. Marketplace panel: mode "Keep between" with defaults 50 / 300.
- Caravans (48): the merchant's Gold range rises from 100–300 on day 1 to 100–1000 by day 30 (`CARAVAN_RULES.
  richGoldMax`, `richByDay`), goods grow with the Gold (up to ×2). Escort: 0–2 porters (50 % each) and guards by the
  Gold (none below 200, then Gold/170 rounded, 1–6). Saved as `caravans.active.escort` (validated). `CaravanViews`
  draws guards around the wagon and porters walking between the wagon and the Marketplace while trading (provisional
  drawings until the Grafika art). The escort are not residents and leave with the caravan.
- Vehicles (57): a Wheelbarrow takes 300 s (was 30 s). Parked Wheelbarrows and Horse Wagons (not in use or reserved)
  can be sold to a trading merchant from the trade window ("Vehicles: Sell Wheelbarrow (96 Gold)"); the price is the
  value of the inputs (120 / 520 incl. a horse worth 160) × the sell factor. A wagon's horse goes with it. The sale is
  immediate (the merchant takes the vehicle where it stands) and is paid from the merchant's Gold.

## Implementation decisions
- Selling a vehicle does not need Haulers: vehicles are not stored goods.

## Save/Load impact
Optional `escort` in the active caravan; SAVE_VERSION stays 58.

## Testing
`tests/trade-2.test.js`, `tests/caravans.test.js` (gold by day, escort), `tests/wheelwright-vehicles.test.js`
(300 s); browser smokes `--marketplace` (escort drawn, vehicle sold, Keep between offered), `--wheelwright` (stepped
ahead), `--horse-wagon`.

## Notes for the next agent
- Porter and guard drawings are provisional; a Grafika task could add Studio art.
