# Balance 1 – wood from day 1, food balance, developer Balance panel

Plan items **m-drevo-start** (playtest 0.76.0 #2) and **m-jidlo-balanc** (playtest 0.76.0 #3).

## What and why

- **Wood at the start (m-drevo-start).** The 90 starting Wood went into tutorial buildings before a Lumberjack Hut
  stood, so the kingdom then made ~6 Wood a day with idle residents. Now:
  - the tutorial asks for the **Lumberjack Hut right after the Granary** (before the Hunting Lodge);
  - **Lumberjack Hut +50 %**: chopping a tree takes 7 s instead of 15 s (measured in an ad-hoc
    headless scene, 2 Woodcutters + 1 Hauler with trees in reach, 3 days: 60 → 90 Wood a day = +50 %);
  - the New Game start is **30 Stone + 110 Wood + 160 Bread** (still exactly the 300-unit Starter Stockpile).
- **Food balance (m-jidlo-balanc).** Day 9 of the playtest made 11.8 food and ate 18. Now:
  - Hunters search game within **34 tiles** (other workers 24), respawned game appears **near a finished Hunting
    Lodge** when it can, and game leaves **~30 % more meat** (Rabbit 5 → 7, Deer 10 → 13, Wild Boar 15 → 20);
  - Fishers **+50 %** (6 → 9 fish a day) and **×1.2 more while the water is Plentiful**;
  - Fields and orchards **+20 %**: crops grow 1.2× faster (more harvests);
  - the Bakery makes **5 Bread** per batch (was 4; 4 Wheat → 3 Flour → 7.5 Bread);
  - rations eat fewer portions: **Small 0.4, Normal 0.8, Generous 1.2** (was 0.5 / 1 / 1.5); the Food need percentages
    (30 / 60 / 80 %) are unchanged. Children eat nothing in this game (src/data/children.js), so "children eat half"
    needs no change.
  - The food line in the HUD and the Policy panel ("eaten") now use the portions really eaten (King 2 + residents ×
    portions), so the days of food match.
- **Developer Balance panel.** Settings → Developer: **5 clicks on the version line** (within 3 s) reveal a hidden
  **Dev mode** switch. In Dev mode a **Balance** button opens a panel with 11 multiplier sliders (0.25–3×): hunter,
  fisher, fields/orchards, bakery, mill, woodcutter, quarry/mine, portions eaten, immigration, wages, taxes. They act at
  once, are kept in this browser (localStorage `newgame.devBalance`), **Reset** returns 1×, **Copy values** puts the
  JSON on the clipboard (the owner sends it and the numbers become new defaults in data). A live overview shows food a
  day (made / eaten / net, stock), wood yesterday (in / out), gold a day (Policy balance: taxes, wages), Happiness and
  idle residents. With Dev mode off every multiplier is 1 and nothing of it is visible.

## Files and systems

- Data: `src/data/tutorial.js` (order), `src/systems/GameSettings.js` (NEW_GAME_DEFAULTS), `src/data/naturalResources.js`
  (chopDuration 7000, `legacyChopDuration`), `src/data/objects/animals.js` (meatDrop), `src/data/workplaces.js`
  (`HUNTING_RULES`), `src/data/fishing.js` (perDay 9, `plentiful`), `src/data/farming.js` (`growthRate`),
  `src/data/foodProduction.js` (bakery 5, `LEGACY_RECIPE_OUTPUTS`), `src/data/policy.js` (portions).
- New `src/data/devBalance.js` – the ONE multiplier module (`devFactor(key)`, set/reset/load, storage, Dev mode).
- Read points of `devFactor`: `ForestryWork` (chop work, woodcutter), `FishingSystem` (catch rate, fisher; also the
  Plentiful factor), `FarmingSystem.advanceGrowth` (farming; also `growthRate`), `FoodProductionSystem` (cycle work
  speed, mill / bakery), `MiningWork` (quarry/mine work, mining), `FoodSystem.portionsPerDay` (consumption),
  `WorkerSystem.onNewDay` (immigration; fractional migrants carry to the next day), `WageSystem.dailyWage` (wages),
  `PolicySystem.dailyTaxes` (taxes), `GameScene.onUnitDeath` (meat of killed game, hunter).
- `WorkerAI.withinRange` (Hunter radius), `WildlifeRespawnSystem.spawnOne` (near-lodge preference).
- New `src/ui/DevBalancePanel.js` (switch row + panel built in JS, no index.html markup), wired in `GameScene`
  (create / destroy); i18n keys `dev.mode`, `dev.balance.*` in `en.js` / `cs.js`; a few `.dev-balance-*` rules at the
  end of `style.css`.
- Save checks: `FoodStateValidation` (legacy Bakery batch), `GameStateSerializer` (legacy tree chop progress),
  `FoodProductionSystem.finish` (a batch yields what it reserved).
- Scripts: `scripts/balance-sim.mjs` (20-day simulation), `scripts/dev-balance-smoke.mjs` (`--dev-balance`),
  `scripts/browser-smoke.mjs` (registration; setup defaults 110/160; the "slider stops at the remaining room" step
  now zeroes Wood first), `scripts/tutorial-smoke.mjs`, `scripts/start-v2-smoke.mjs`, `scripts/policy-smoke.mjs`.

## Implementation decisions

- **Rates, not amounts per batch, where saves hold reservations.** A chop task reserves the tree's wood in the
  20-unit hut pile, and a harvest reserves its yield; the save check compares them with the data. So Wood per tree
  (6/5) and Wheat/Apples per harvest (8/6) stay; Woodcutters chop faster and crops grow faster instead. (9 Wood per
  tree would also leave the 3rd Woodcutter waiting at a full 20-unit pile.)
- The Bakery's +1 Bread is a real amount change (the spec asks for it): `finish` deposits what the batch reserved, and
  the save check accepts a reservation of the earlier 4 Bread (`LEGACY_RECIPE_OUTPUTS`), so a save with a running
  batch still loads and finishes with 4.
- The Wildlife Respawn interval is unchanged (the Off/Slow/Normal/Fast setting keeps its meaning); "faster near the
  village" is done by placing respawned game within 30 tiles of a finished Hunting Lodge when possible, plus the longer
  Hunter radius.
- Mill and bakery multipliers scale the batch work speed, woodcutter/mining the work speed, farming the growth,
  fisher the catch rate, hunter the meat per kill, consumption the portions, immigration the migrants per day,
  wages/taxes the gold amounts. The hunter multiplier is applied in `GameScene.onUnitDeath` only (test scenes use their
  own death handler).
- Dev mode off = all factors 1, even with stored values; turning Dev mode off hides the panel at once.

## Save/Load impact

SAVE_VERSION stays 60; nothing new is saved (multipliers live in localStorage only). Older saves load: a tree saved
with chop progress up to the earlier 15 s is accepted (`FORESTRY.legacyChopDuration`) and falls at the next work step;
a Bakery batch saved with 4 Bread reserved is accepted and yields 4. Meat drops, fish, growth progress and rations need
no migration.

## Testing

- `npm test`: 1126 / 1126 pass (1119 before + 7 in the new `tests/balance.test.js`: tutorial order, chopping from data,
  start fits the stockpile, food data, multipliers only in Dev mode / clamped / stored / Reset → 1× / broken storage,
  consumption multiplier changes what is eaten, the switch and panel are invisible without Dev mode and work with a
  small fake DOM). Updated tests that pinned the old numbers keep their intent and mostly read the data now:
  tutorial order, 30/110/160 start, meat 7 (rabbit), 15 Bread chains (3 batches × 5), rations 0.4/0.8/1.2, crop growth
  × `growthRate`, King chop time from data, the fishing distance test measures the time to 15 fish (whole baskets of 5
  tied in a fixed window at 9 fish a day).
- `npm run build -- --base=/Newgame/`; browser smokes, each alone: `--dev-balance`, `--tutorial`, `--start-v2`,
  `--policy`, `--fishing`, `--e2` – all PASS.
- Simulation `node scripts/balance-sim.mjs` (default New Game in the real build, seeded, tutorial buildings + 1 Wheat
  Field + 2 more Houses placed in tutorial order as soon as affordable, 1 Builder + 1 Hauler by hand, Auto Employment),
  before = HEAD 0.77.2 build, after = this change. Selected days:

| day | food made before / after | eaten before / after | food stock before / after | wood stock before / after | wood chopped (total) before / after | gold before / after | happiness before / after | residents | idle before / after |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0 / 0 | 11 / 2 | 168 / 157 | 4 / 4 | 0 / 0 | 495 / 494 | 84 / 83 | 10 / 10 | 1 / 1 |
| 5 | 5 / 25 | 13 / 13 | 129 / 150 | 10 / 7 | 11 / 28 | 464 / 464 | 85 / 86 | 12 / 13 | 1 / 1 |
| 8 | 16 / 12 | 16 / 15 | 125 / 159 | 62 / 87 | 74 / 109 | 489 / 459 | 84 / 81 | 15 / 15 | 1 / 1 |
| 10 | 20 / 15 | 18 / 17 | 135 / 180 | 97 / 162 | 108 / 157 | 470 / 470 | 82 / 83 | 17 / 17 | 1 / 1 |
| 12 | 32 / 20 | 20 / 17 | 142 / 237 | 131 / 182 | 142 / 168 | 451 / 450 | 83 / 83 | 19 / 19 | 1 / 1 |
| 15 | 29 / 52 | 23 / 21 | 126 / 299 | 174 / 227 | 191 / 220 | 456 / 455 | 85 / 84 | 22 / 22 | 2 / 2 |
| 18 | 3 / 38 | 26 / 23 | 71 / 297 | 197 / 240 | 203 / 226 | 423 / 422 | 82 / 82 | 24 / 24 | 4 / 4 |
| 20 | 22 / 30 | 26 / 24 | 42 / 290 | 197 / 240 | 203 / 226 | 401 / 400 | 83 / 85 | 24 / 24 | 4 / 4 |

  Averages days 10–20: before made 15.3 / ate 22.7 food a day (stock 135 → 42), after made 33.3 / ate 18.5 (stock
  180 → 290, flat at ~290 from day 15 with 24 residents) – balanced to slightly positive as asked. Wood days 5–9
  (one Woodcutter): before ~20, after ~26 chopped a day. Gold falls ~11 a day in both (wages > taxes; not part of
  these items). Single runs vary a little between runs (the game loop is not fully deterministic).

## Notes for the next agent

- **Wood is limited by the forest, not by chopping**, after ~day 12: both runs end with Woodcutters waiting "No mature
  trees in working radius" (chopped total stops at ~200–230). If wood is short later, look at tree regrowth
  (`FORESTRY.stageDays`) or the Lumberjack Hut's `workRadius`, not at chop time.
- Owner's tuned values from the Balance panel ("Copy values") map 1:1 to the data above: hunter → meatDrop
  (animals.js), fisher → `FISHING.perDay`, farming → `FARMING_RULES.growthRate`, bakery/mill → recipe `duration`
  (or output), woodcutter → `chopDuration`, mining → mining durations, consumption → `RATIONS.*.portions`,
  immigration → `POPULATION.migrantsPerDay`, wages → `BASE_DAILY_WAGES`, taxes → `TAX_RATES`. Changing an amount
  that a save reserves (tree wood, crop yield, recipe output) needs a legacy tolerance like `LEGACY_RECIPE_OUTPUTS`.
- `scripts/balance-sim.mjs --dist=<other build> --days=N` compares builds (build an old commit with `git archive`
  into /tmp and symlink node_modules).
- Not done: a CHANGELOG entry and version bump (left to the release step by instruction).
