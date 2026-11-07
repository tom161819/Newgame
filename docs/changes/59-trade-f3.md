# Trade F3: automatic trade (#59, 7 Nov 2026)

## What and why
F3 is the last approved phase of S14 trade (umbrella `m-59`, original spec `docs/upgrades/14_27_merchants_trade.md` §12–13). The player can set rules once and let the kingdom trade while a caravan is at the Marketplace:
- sell surplus above a reserve at a minimum price;
- buy a good when its stock runs low, up to a target, at a maximum price and within a budget per caravan visit.

Automatic trade is off by default.

## Files and systems
- `src/data/trade.js`:
  - `AUTO_TRADE`: check every 2 s of game time, default budget 100, limits, a food reserve of 3 days × 2 meals per resident.
  - `autoRule()` cleans and validates a rule.
  - `validateAutoTrade()` checks the save.
- `src/systems/TradeSystem.js`:
  - `auto` state `{enabled, budget, rules, visit}`.
  - `setAutoEnabled`, `setAutoBudget`, `setAutoRule`.
  - `autoQuantity()`, `autoTrade()` (called at the start of `update()`).
  - `foodReserve()` and `autoWarning()`.
  - Automatic orders carry `auto: true`. Export and import of `auto`.
- `src/systems/GameStateSerializer.js`: `SAVE_VERSION` 49. The trade state is `auto, orders, seq, stats`. An order may have `auto: true`.
- `src/ui/MarketplacePanel.js`, `index.html`, `src/style.css` and i18n en/cs:
  - A collapsible "Automatic trade" section showing the on/off state and rule count.
  - An enable checkbox and a budget field.
  - Per good: Off / Auto sell / Auto buy, with its fields.
  - Each good shows its current prices, a "traded this visit" mark and the food warning. Invalid values are refused and marked.
- Event feed: "Automatic trade: selling/buying N Good at P Gold each."
- Tests: `tests/trade-f3.test.js` (7). `scripts/marketplace-smoke.mjs` sets rules in the panel and turns automatic trade on and off.

## Implementation decisions
- **One rule per good.** A rule is either a sell rule or a buy rule, so a good can never be bought and sold back automatically (S14: no conflicting rules, no endless cycles).
  - Together with **at most one automatic order per good per caravan visit** (`visit.done`), this rules out loops even when prices move.
  - The manual window's existing `otherSide` check still applies.
- **Same rules as a manual order.**
  - Automatic orders go through `place()`, so every manual check applies: free stock only (construction reservations are respected), Gold, storage room, Marketplace room, the merchant's stock and Gold, and the treasury limit.
  - `autoQuantity()` caps the amount at those limits before quoting, so an order is not refused for asking too much.
- **Time to departure.** The amount is halved until the rough delivery estimate fits the time before the caravan leaves. Nothing is placed while the caravan waits to leave.
- **Budget.** Only buying counts against the budget, per caravan visit (`visit.spent`). A new caravan starts a new visit.
- **Food.**
  - The player sets the reserve (`keep`); automatic selling never goes below it.
  - A warning shows when a sell rule on an edible good (apple, bread, meat, fish) would leave less edible food than 3 days of meals for every resident, or when its reserve is below that.
  - Wheat and Flour are not eaten directly, so they get no warning.
- **Defaults when a rule is switched on.**
  - Sell: keep the price model's reference amount, at least today's base sell price.
  - Buy: below half the reference, up to the reference, at most about 10 % over today's base buy price.
- **Throttling.** Rules are checked every 2 s of game time, plus at once after a setting changes. That is enough for a caravan stay of 0.75 day and avoids work every frame.

## Save/Load impact
`SAVE_VERSION` goes from 48 to 49. Rules, budget, the on/off switch and the current visit (which goods were already traded and how much was spent) are saved, so loading does not place a second order for the same visit. Validation rejects:
- unknown goods or modes;
- extra fields;
- negative or non-whole amounts;
- a buy target below its trigger;
- an order with `auto` set to anything other than `true`.

## Testing
- `npm test` passes (886).
- `npm run smoke -- --current-only --marketplace` passes. The automatic trade panel screenshot was checked.

## Notes for the next agent
- S14 is complete with F1–F3; `m-59` is marked done. Still out of scope, for later tasks: route safety and bandits (once there are enemies), the kingdom's own caravans, and luxury goods.
- To change how often rules are checked or the food reserve, edit `AUTO_TRADE` only.
