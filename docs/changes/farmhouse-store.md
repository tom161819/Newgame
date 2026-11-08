# Farmhouse store – Wheat and Flour live in Farmhouses

## What and why
Owner decision (8 Nov 2026): "add a store for flour and grain in the Farmhouse, remove it from the Granary". Every completed
Farmhouse now has its own store for Wheat and Flour (200 units together). The Granary keeps only the edible food (meat,
fish, apples, bread). Farmers carry the harvest to the nearest Farmhouse with room. Haulers bring the Mill's Wheat from Farmhouse
stores, take its Flour back to a Farmhouse and supply the Bakery from there. Bread still goes to the Granary. Since 0.69.0 the Farmhouse has been a rat
building that never held food (docs/changes/animals-3.md). It now has stock, so rats grow there by the Granary rules and a cat
living there clears them.

## Files and systems
- `src/data/farming.js` `FARMHOUSE_STORE` {capacity 200, resources wheat/flour}; `src/data/objects/farming.js` gives the
  Farmhouse `storage` (no `accepts`, so it is registered in both storage modes); `src/data/objects/foodProduction.js`:
  the Granary takes `FOOD_RESOURCE_IDS` minus the Farmhouse goods.
- `src/data/granaryCapacity.js`: `GRANARY_GROUP_CAPACITY` is now `{food:1000}` (the raw group is gone). `granaryGroup` returns
  null for a good without a group, and `granaryUsage` and `FoodStorageSystem.groups` build their keys from the capacity object.
- `src/data/logistics.js` `stockLocationId`: a Farmhouse store is `farmhouse-<id>` (kind `storage`, so `isStock` is true:
  trade, spending, `available`, LogisticsTaskManager sources/destinations, rats, thieves and StorePreview all see it with no other change).
- `src/data/resourceGroups.js`: `foodRaw` = goods a Granary *or* Farmhouse store takes and nobody eats (Wheat, Flour stay raw food in
  the bar, the store preview and the Marketplace).
- `src/game/GameScene.js`: a building that has both a store and a workplace (the Farmhouse) opens the workplace panel. `src/ui/WorkplacePanel.js`
  shows the store line (`#farm-store-text`, "Store: 150 Wheat + 20 Flour · 170/200") and an "Open store" button
  (`#farm-store-open`) that opens the ordinary store window.
- `src/systems/FoodStateValidation.js`: a world without the storage system may still contain a Farmhouse (it is a workplace first).
- Texts (en/cs): Granary and Farmhouse descriptions, wiki winter and rats topics (+ wiki links Rats ↔ Farmhouse), Getting
  started "why" lines, Mill tutorial step, Starter Stockpile removal hint, new `workplace.store`/`workplace.openStore`. The
  unused `storage.granary.raw` key was removed.

## Implementation decisions
- Capacity 200 per Farmhouse, shared between Wheat and Flour: the Material Yard's 400 holds heavy materials, a Farmhouse
  feeds up to 4 fields (8 Wheat each every 2 days), so 200 is several seasons of one farm's harvest. More farms add more room.
  It also needs one cat (`CATS.capacityPerCat` 600).
- Destination order is unchanged `findDestination`: the nearest reachable Farmhouse store with room (route length decides,
  so normally the Farmer's own Farmhouse). While no Farmhouse has room, the existing fallback applies: the Starter Stockpile
  (or the legacy food camp), which still takes Wheat/Flour. Haulers later consolidate it into a Farmhouse (priority 40, one-way).
  If nothing has room, the Farmer does not start the harvest. Ripe crops never rot (no decay in `FarmingSystem`), so the
  crop waits on the field and nothing is lost. The Granary is never a fallback for grain (owner: "remove it from the Granary").
- No `accepts` filter or new location kind was needed. The store is an ordinary `storage` location limited by its `allowed` list,
  like the Material Yard (0.65.0) pattern of a store that takes only some goods.
- The "Storage full" notice needs no code change: `storageHelper` now finds the Farmhouse as the buildable store for Wheat and
  Flour, so the advice says to build a Farmhouse. The chain advice ("Wheat is piling up – build a Mill") counts kingdom stock and is
  still correct. No Getting started or Royal goal counts grain in the Granary (checked), so none changed.
- The top-bar store gauge (`#storage-capacity`) still counts only the material stores (Starter Stockpile, Warehouse, Yard),
  as before (the Granary was never in it). The Farmhouse store shows in its panel, the store window and the map preview.

## Save/Load impact
`SAVE_VERSION` 59 → 60. Saves now contain a `farmhouse-<id>` storage location for every completed Farmhouse, and a Granary's
`allowed` list no longer has wheat/flour, so a schema-59 save would fail validation anyway. By the alpha policy, older saves are refused
(not migrated). Validation rejects grain in a Granary, an overfull Farmhouse store, other goods in it and a missing Farmhouse store.

## Testing
- `npm test` (node scripts/test.mjs): 1103/1103 pass (1097 before + 6 new). New `tests/farmhouse-store.test.js`: data and
  refusal; Farmer → Farmhouse and the Starter Stockpile fallback when it is full; Haulers run Farmhouse → Mill → Farmhouse
  → Bakery → Granary (and the Granary never holds grain); trade sells Wheat from a Farmhouse and buys Flour into a store
  other than the Granary; Save/Load and rejected forgeries. New rat test in `tests/domestic-animals.test.js`: rats grow
  in a full Farmhouse store and one cat clears them.
- Updated fixtures that put Wheat/Flour into a Granary (intent kept): food-production, granary-capacity(-groups),
  haulers-food, logistics-construction, logistics-haulers, production-diagnostics, seasons-food, domestic-animals,
  building-unlocks, farm-plots (a hand-removed Farmhouse now also calls `foodStorage.removeBuilding`).
- `npm run build -- --base=/Newgame/` OK. New smoke `node scripts/browser-smoke.mjs --current-only --farmhouse-store`
  PASS (real build of Farmhouse + Granary, resource bar `foodRaw`, map preview, panel store line + rats line, Open store
  window, Save/Load; screenshot /tmp/shots/farmhouse-store.png). Re-run and passing: granary-capacity (fixture
  updated: the Granary has only the food row), storage-window, storage-notices, chain-notices, marketplace, animals-3,
  tutorial, e1, e4, getting-started, farmer-establishment, farm-plots, farm-blueprint, farmer-tending, repeat-placement,
  wiki, pets, resource-groups, king-xp, mill-sails, building-unlocks, workplace-output, policy, chosen-art, fishing,
  staffing and stockpile-cleanup. Staffing and stockpile-cleanup failed only inside a shared `--keep-going` run and passed alone.
  The first, unfixed granary-capacity failure left a Granary on the shared page, so the closing building-menu check then failed too.

## Notes for the next agent
- Same release: `HAPPINESS_ATTRACTIVENESS` threshold for +15 lowered from 80 to 75 (owner, 8 Nov), so the lower food need from 0.68.0 doesn't slow immigration.
- `GRANARY_GROUP_CAPACITY` has only `food`. If a raw Granary good comes back, add its group there (and a
  `storage.granary.<group>` text). `granaryGroup` returns null for a group with no capacity.
- Two Haulers can both pick the same trade delivery in one planning tick (stale catalog amount). The spare load is carried back to a
  store, so nothing is lost. This was not changed here; `tests/farmhouse-store.test.js` waits for it.
- Demolishing a Farmhouse spills its grain like any store (`FoodStorageSystem.removeBuilding`). Haulers bring it back to
  stores that have room.
