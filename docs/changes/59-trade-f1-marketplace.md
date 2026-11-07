# Trade F1.1 – Marketplace and price table (S14 #59, 7 Nov 2026)

## What and why
First of three steps of trade F1 (brief `zadani-obchod-f1.md` in the claude.ai project, approved by the owner on 7 Nov 2026; plan item `m-obchod-f1-1-trziste`). Gold income stays at 5/day while wages grow, so trade is to become the way to earn Gold. This step adds the building and the prices; caravans (F1.2) and orders (F1.3) follow.

## Files and systems
- `src/data/trade.js`: `TRADE_RULES` (buy 115 %, sell 80 %, goods space 80, 2 loading spots), `BASE_PRICES`, `tradeableResources(registry)` (collectible resources except Gold and vehicles), `price(resource, side, context)` (whole Gold, minimum 1, buy always above sell; `context` reserved for F2 live prices, `basePrice` override already accepted), `priceTable`.
- `src/data/objects/logistics.js`: `marketplace` (3 × 3, 12 Stone + 8 Wood, 30 s, requires a completed Warehouse, `trade:{capacity, loadingSpots}`, interaction `open_market`); validated in `ObjectRegistry` (`trade`). Provisional procedural-style sprite `public/assets/buildings/marketplace/marketplace.svg` (three stalls, crates, barrel) until the Grafika task `g-obchod-trziste-povoz`.
- `src/ui/MarketplacePanel.js` + `#marketplace-dialog`: caravan status ("No caravan yet"), goods space, loading spots, orders placeholder, price list. A click on a finished Marketplace opens it (`GameScene`); right click/Esc close it.
- i18n `market.*`, object names (en, cs), styles.
- Tests: `tests/trade-marketplace.test.js`; registry counts in `assets`/`building-categories` tests; smoke `scripts/marketplace-smoke.mjs` (`--marketplace`, in `--full`; `SMOKE_SHOTS=<dir>` saves screenshots).

## Implementation decisions
- Prices of processed goods differ from the brief's proposal (Iron Bar 18, Sword 30, Armor 40): at those prices making them would destroy value (inputs at base prices: Bar 35, Bow 32, Sword 128, Armor 208 Gold). They are inputs plus about 10–15 %: Iron Bar 40, Bow 36, Sword 145, Armor 235. Bow and the older Iron resource were not in the brief; Iron trades like Iron Ore (9).
- Wheat at 2 Gold rounds to 2 / 2, so the buy price is raised to sell + 1 (3 / 2).
- The goods space has no stock yet, so nothing new is saved: no `SAVE_VERSION` change in this step (F1.2/F1.3 will add caravan and order state). A finished Marketplace is an ordinary building in the save.
- No `menuOrder`: in the Logistics tab the Marketplace sits between Warehouse and Stables by registry order (a menuOrder would move it before the Warehouse).

## Save/Load impact
None (new building type only).

## Testing
`npm test` passes (820). `npm run smoke -- --current-only --marketplace` passes.

## Notes for the next agent
- F1.2 stores the goods space on the Marketplace (for example `building.market.stock`); `MarketplacePanel.goods()` already reads `building.market?.stock`.
- `price()` is the single place for prices; F2 passes supply/demand in `context`.
