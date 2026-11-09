# Dev tool (m-91-asset-library-dev, owner point 88)

## What and why

The owner wants to tune the economy while playing ("subjects arrive too slowly, I will tune it"). The hidden 0.78 Balance
panel (5 clicks on the version in Settings) becomes the **Dev tool**: an icon (wrench) right under the Settings icon opens
a pop-up menu; a second click or Esc closes it. Settings has "Show Dev tool" (alpha default ON) to hide the icon.

Menu, top to bottom:
- **Arrival of subjects** slider first, with "Next resident in ~X h (N a day)" in game hours and what limits arrival now
  (no free beds, too little food, too many unemployed, attractiveness below 100 %).
- Coefficients ×0.25–×4, step 0.25, default ×1: Production (all buildings), Food consumption, Wages, Taxes / gold income,
  Market buy prices, Market sell prices, Construction speed, Field and orchard growth.
- "Advanced" fold: the 0.78 per-building multipliers (hunter, fisher, fields and orchards, bakery, mill, woodcutter, quarry and mine).
- Economy overview (read only): last closed day and the average of the last 3 days, income / expenses of Gold, every food
  kind and Wood, Stone, Iron (resource ledger); happiness, unemployed, free beds.
- Quick actions: +100 Gold, +50 of each resource, Advance 1 day, Summon a caravan, Add 1 resident.
- Building tooltip delay (0.81), Reset to default, Copy values (JSON), Profiler · F8 (0.80).
- A small gold dot on the icon while any coefficient differs from ×1.

## Files and systems

- `src/data/devBalance.js` – keys (`DEV_MAIN_KEYS`, `DEV_ADVANCED_KEYS`), range ×0.25–×4, `devFactor`, new `devProduction`,
  save helpers `exportDevBalance` / `validDevBalanceState` / `importDevBalance`, `devBalanceChanged`, `onDevBalanceChange`, `DEV_QUICK`.
- `src/systems/DevTools.js` (new) – `arrivalForecast`, `economyOverview`, quick actions (`addDevGold`, `addDevResources`,
  `advanceDevDay`, `summonDevCaravan`, `addDevResident`). No DOM.
- `src/ui/DevBalancePanel.js` – rewritten as the Dev tool menu (class name and `scene.devBalancePanel` kept for the smokes).
- `index.html` – `#dev-tool-button` (inline SVG wrench + `.dev-tool-dot`) right after `#settings-button`.
- `art/ui/uiConfig.js` – `FREE_REGIONS.devTool` (`.dev-tool-button`), so the UI Lab's free placement can move the icon.
- `src/style.css` – icon, dot, forecast, Advanced fold, overview table, quick actions.
- Coefficient hooks: `WorkerSystem` (immigration, unchanged), `FishingSystem` / `ForestryWork` / `MiningWork` / `GameScene`
  hunting / `FoodProductionSystem` (now `devProduction`), `FarmingSystem` (`farming` × `growth`), `ConstructionSystem.workSpeed`
  (`construction`), `TradeSystem.marketContext` + `data/trade.js price()` (`buyScale` / `sellScale`), `ProductionSystem`
  (Castle Gold income × `taxes`), `PolicySystem` taxes, `WageSystem`, `FoodSystem` (unchanged).
- `src/systems/BackgroundSimulation.js` – `queue(ms)` for "Advance 1 day".
- Save: `GameStateSerializer.js` (export + validation), `GameStateLoader.js` (import).
- i18n en/cs: new `dev.tool.*`, `dev.arrival.*`, `dev.overview.*`, `dev.action.*`, new key labels; removed `dev.balance.open`,
  `dev.balance.title`, `dev.balance.overview`.
- Tests: `tests/dev-tool.test.js` (new), `tests/balance.test.js`, `tests/night-tooltips.test.js` updated.
- Smokes: `scripts/dev-tool-smoke.mjs` (new, `--dev-tool`), `scripts/dev-balance-smoke.mjs` rewritten for the new UI.

## Implementation decisions

- **Coefficients belong to the game, not the browser.** They act whether or not the icon is shown ("Show Dev tool" only
  hides the UI). A new game starts at ×1; Load sets exactly the save's values (a save without the field = ×1).
  localStorage `newgame.devBalance` keeps only `{mode, tooltipDelay}`; old 0.78–0.81 `values` there are ignored.
- **5-click unlock dropped.** "Show Dev tool" is always visible in Settings' Developer section; `DEV_UNLOCK` was removed.
  Default ON in alpha (`mode` absent = shown). F8 profiler works while the tool is shown.
- **Production master** multiplies the per-building ones (`devProduction(key)` = own × production); FoodProductionSystem
  passes the building type, so every recipe building (not just mill/bakery) follows Production. Field and orchard growth
  has its own `growth` (× the advanced `farming`), so fields are not counted twice.
- **Taxes / gold income** also scales the Castle's daily Gold (rounded to 0.01 Gold).
- **Prices**: separate buy and sell scales inside `price()`, so the Marketplace table, orders and auto-trade show the same
  numbers; the buy price stays ≥ sell + 1 even with odd combinations.
- **Construction speed** scales `workSpeed` (building, establishing fields, demolition, and the time estimate).
- **Arrival forecast**: migrants arrive at day boundaries, `migrantsPerDay × factor` a day with the fraction carried;
  hours = rest of today + further days × 24. `migrantCarry` is still not saved (as in 0.78).
- **Quick actions respect limits**: Gold through `inventory.add` (GOLD_LIMIT), resources only into free store room (never
  spilled on the ground; equipment and Gold excluded), a resident only with a free bed (`spawnNearStart`), a caravan only
  through `CaravanSystem.summon` (needs a Marketplace and no caravan present), a day through the normal background catch-up
  (same overlay and away summary, the whole simulation runs).
- **Icon position**: CSS default under the Settings icon; JS (every 1 s and on resize) puts it centred 8 px under wherever
  `#settings-button` is (layout left/right or its free frame) unless the icon itself has a free frame (`data-ui-free`).
  The menu opens beside the icon on the side towards the screen centre, height limited to the viewport.
- **Esc** is caught in the capture phase on `window` while the menu is open (no dialog open), so it does not open the Game Menu.

## Save/Load impact

New optional save field `devBalance` (SAVE_VERSION stays 60): an object with only the keys that differ from ×1, e.g.
`{"immigration":4,"taxes":2}`; absent when everything is ×1. Validation: plain object, at least one key, every key one of
`DEV_BALANCE_KEYS`, every value a finite number in 0.25–4 on the 0.05 grid; anything else = corrupt save. Old saves load
unchanged (×1).

## Testing

- `npm test` (node scripts/test.mjs): 1174/1174 pass (6 new in `tests/dev-tool.test.js`: arrival ×0.25/×0.5/×2/×4
  proportional, forecast hours and limits, clamping + Production × per-building + Reset, buy/sell price scales, save
  round-trip + strict validation + missing field = ×1, quick actions within limits incl. Advance 1 day via the catch-up).
- `npm run build -- --base=/Newgame/` OK.
- Browser smokes (each alone, `--current-only`): `--dev-tool` (icon under Settings, menu, Arrival first, slider → taxes ×2,
  dot, +100 Gold, +resources, +1 resident, Esc, Save/Load keeps `{immigration:4,taxes:2}`, +1 day, Reset, Show Dev tool),
  `--dev-balance`, `--performance`, `--building-tooltip`, `--ui-windows`, `--policy` – all PASS.

## Notes for the next agent

- New coefficient: add the key to `DEV_MAIN_KEYS` (or `DEV_ADVANCED_KEYS`), read `devFactor(key)` at the point of effect,
  add `dev.balance.key.<key>` in en and cs. Save validation and the menu pick it up automatically.
- Do not gate factors on `devMode()` again: values in a save must act after Load even with the icon hidden.
- The Studio UI Lab lists `FREE_REGIONS.devTool`; the icon only appears in game (`body.in-game`) and when "Show Dev tool" is on.
- The owner copies values with Copy values; turning them into data defaults is a separate balance task.
