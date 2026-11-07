# Trade F1.3 – trade window and orders carried by Haulers (S14 #59, 7 Nov 2026)

## What and why
Last step of trade F1 (brief `zadani-obchod-f1.md` §5–6, plan items `m-obchod-f1-3-objednavky` and the umbrella `m-obchod-f1-trziste-karavany`). With F1.1 (0.9.5) and F1.2 (0.10.0) the kingdom can now buy and sell goods; Gold is earned by selling surpluses.

## Files and systems
- `src/systems/TradeSystem.js` (`scene.trade`): orders `{id, caravanId, marketplaceId, resource, side, quantity, price, delivered, status, placedAt}` with statuses Pending / Transporting / PartiallyCompleted / Completed / Cancelled / Failed; `quote()` with the brief's errors (plus "treasury full" for the 500 Gold limit and "another order for this good is running"); `place`, `cancel`, `caravanLeft`; `update()` unloads purchases (pays per unloaded unit) and hands over sold goods (Gold per unit on hand-over, ledger `Trade Sale`/`Trade Purchase`); `candidates()` for `LogisticsTaskManager`: priority 5 carry goods for a sale from the stores to `market-<id>`, priority 25 carry everything else on a Marketplace into stores that take it; sets `caravans.deliveryPending` (a Transporting order keeps the caravan up to 0.25 day).
- `FoodStorageSystem.register`: a finished Marketplace gets location `market-<id>`, kind `market`, capacity 80, all tradeable goods; `isStock` is false, so no other logistics uses it. `FoodStateValidation` expects it.
- `CaravanSystem.leave` calls `trade.caravanLeft`. `GameScene` creates/updates/destroys `TradeSystem`.
- `MarketplacePanel`: trade table (caravan stock, kingdom free stock, buy/sell price, amount, Buy / Max ▲ / Sell / Max ▼), live quote line (total, Gold, store room, rough ETA, late warning, errors), last orders with Cancel; the plain price list is hidden while trading. The table is not rebuilt while an input in it has focus.
- Save: `SAVE_VERSION` 39 (minor 0.11.0), `trade: { seq, orders }` (open orders + last 30 finished) validated; the market location and in-flight hauler tasks are part of the existing `foodStorage` state.
- i18n `market.*`, `ledger.Trade Purchase/Sale`; styles; tests `tests/trade-orders.test.js`; smoke `scripts/marketplace-smoke.mjs` sells 20 Wood through the window and checks the Gold on hand-over.

## Implementation decisions
- A sale does not hold a bulk stock reservation in the stores (unlike construction sites, whose reservation code is tied to `site-<id>` owners throughout logistics and validation). The order checks free stock when placed (so goods reserved for construction cannot be sold) and Haulers carry what is still missing; if goods are used up meanwhile, the order stays Transporting until the caravan leaves and is then cancelled for the rest.
- Purchases need room in the stores for the whole amount when ordered; unloading waits for room on the Marketplace.
- Buying and selling the same good at once is refused, so goods on the Marketplace are never ambiguous.
- Gold is not physical (as before): sale income uses `inventory.add('gold')`, purchases `inventory.pay`; a sale that would push the treasury over 500 is refused instead of losing Gold to the cap.

## Save/Load impact
New schema 39; older saves are rejected with the usual notice. Mid-order saves continue: goods in transit, on the Marketplace and the order counters are restored; nothing is paid or carried twice (test).

## Testing
`npm test` passes (833). `npm run smoke -- --current-only --marketplace` passes (UI sale with real Haulers), also `--building-costs`, `--demolition`, `--needs`.

## Notes for the next agent
- F2 (live prices) changes only `price()` in `src/data/trade.js`; orders keep the price fixed at confirmation.
- F3 (automatic trade) can call `scene.trade.place()` with the same checks.
