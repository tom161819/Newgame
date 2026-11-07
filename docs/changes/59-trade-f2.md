# Trade F2: live prices and trade statistics (#59, 7 Nov 2026)

## What and why
Trade F1 used fixed prices: base price × 1.15 when the kingdom buys and × 0.8 when it sells. F2 (plan item `m-obchod-f2`, umbrella `m-59`) makes prices follow supply. Scarce goods cost more and plentiful goods cost less. The Marketplace also gets a statistics section showing what the kingdom traded and how prices moved. F3 (automatic trade) is still open on `m-59`.

## Files and systems
- `src/data/trade.js`:
  - `PRICE_MODEL`: factor 0.75–1.35, kingdom weight 0.2, merchant weight 0.15, reference stocks, 20 days of history, 12 recent trades.
  - `demand()` returns the factor and its reasons (`kingdomLow/High`, `merchantLow/High`).
  - `merchantTypical()`.
  - `price()` and `priceTable()` take the demand context.
- `src/systems/TradeSystem.js`:
  - `marketContext()` and `unitPrice()`. Quotes and new orders use the live price.
  - `stats`: totals, per-good counts, recent trades and price history.
  - `record()` runs on every hand-over (buy and sell). `recordOffers()` runs when a caravan arrives. `summary()`.
  - Export and import of `stats`, plus `validateTradeStats()`.
- `src/systems/CaravanSystem.js`: records the caravan's offers on arrival.
- `src/systems/GameStateSerializer.js`: `SAVE_VERSION` 48. The trade state is now `orders, seq, stats`.
- `src/ui/MarketplacePanel.js`, `index.html`, `src/style.css` and i18n en/cs:
  - Prices in both tables show a ▲/▼ marker, and a tooltip lists the reasons.
  - Max buttons use the live price.
  - New `#marketplace-stats` section: totals, balance, transactions, top 3 goods, the last 6 trades, and an SVG price-history chart with a good selector.
- Tests: `tests/trade-f2.test.js` (6). `tests/trade-orders.test.js` now uses the agreed order price. `scripts/marketplace-smoke.mjs` checks live prices with reasons, the statistics and the chart after a sale.

## Implementation decisions
- **The price is fixed per order.**
  - The unit price is set when the order is placed (`order.price`) and kept until delivery. Hauling therefore cannot change a deal that was already made.
  - Live prices only affect new quotes and orders.
- **No instant arbitrage.**
  - Buying moves the kingdom's stock up and the merchant's stock down, so the kingdom's selling price after a buy never beats the buying price before it. The same holds the other way for a sale.
  - A test checks this for every good and merchant type over a grid of stocks and quantities.
  - The buy/sell gap (1.15 against 0.8) is larger than the most the factor can move in one trade.
- **What sets the factor.**
  - Kingdom stock is free stock (`available`) compared with a reference amount: 50 for most goods, less for bars and weapons.
  - Merchant stock is compared with the middle of his type's carry range. A merchant who carries none of the good counts as scarce on his side only when his type normally carries it.
- **Where the history comes from.**
  - Only real hand-overs and the caravan's offers on arrival are recorded, at most one entry per good per day, for the last 20 days.
  - Nothing is recorded on days without a caravan, so the chart has gaps rather than invented prices.
- **One transaction per hand-over.** Each hand-over batch counts as a transaction. A 20-Wood sale delivered in 3 batches is 3 transactions, which matches what the player sees in recent trades.

## Save/Load impact
`SAVE_VERSION` goes from 47 to 48, and the trade state requires `stats`. Statistics are validated:
- known goods, sides, whole-number prices and quantities;
- recent trades capped at 12;
- history days within the last 20 and not in the future.

Older saves are rejected like every other schema change; there is no migration, by the project's rule.

## Testing
- `npm test` passes (879).
- `npm run smoke -- --current-only --marketplace` passes, including the statistics and the chart. Screenshot checked.

## Notes for the next agent
- F3 (automatic trade, `m-59`) can use `trade.unitPrice()` and `trade.marketContext()` to decide when a deal is good. Limits can be compared against the `demand()` factor.
- To tune how strongly prices move, change `PRICE_MODEL` only. The no-arbitrage test will show whether the weights are still safe.
