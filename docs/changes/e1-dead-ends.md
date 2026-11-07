# E1 · Dead ends of the first days (report 0.48.0) and the owner's prices

## What and why
Report of 7 Nov 2026 (playthrough of 0.48.0): a newcomer following the tutorial built nothing in 8 days, starved by day
6–10, lost the only house to a night fire on day 5, and saw Czech text in the English interface. Plan tasks
m-e1-drevo-start, m-e1-stavitele-material, m-e1-hrozby-pozdeji, m-e1-jidlo-vydrz, m-e1-texty, plus the owner's
"převzít ceny" (18 proposals from the Studio, 14 applied).

## Files and systems
- Prices (data only): granary wood 12, farmhouse wood 10, hunting lodge wood 8, fisherman's hut wood 10, lumberjack hut
  wood 6, house wood 10, builder's workshop wood 20; owner's Studio prices via `scripts/prices-sync.mjs` (tower and castle
  20 stone, gate 5, quarry 15 wood, mill 4 stone + 20 wood, bakery 10 + 10, barracks 12 + 10, iron mine 20 wood, stables
  20 wood, warehouse 10 stone + 4 wood, village green 6 wood, armorer/bowyer/swordsmith 5 stone + 10 wood).
- `GameSettings.NEW_GAME_DEFAULTS`: wood 60, iron ore 0 (stone 40, bread 40).
- `src/game/freeBuildings.js` (owner comment): a free Lumberjack Hut while none stands or is planned and the stores
  cannot pay it; `GameScene.startBuilding` places `placeableDefinition`; `BuildingBar` shows "Free – …".
- `ProductionDiagnostics`: `waitingMaterial` (booked or free stock in a store, not delivered for `DIAGNOSTICS.materialWait`
  = 30 s), `foodLow` (< 3 days, kingdom notice + feed); `materialsInStock(site)`.
- `BuilderAI.carryMaterials`: Builders also fetch when a site has waited ≥ `materialWait`, even with a free Hauler.
- `NoticesPanel`: "Add a Builder" / "Add a Hauler" buttons (`hireUnemployed` in `src/ui/jobChange.js`; nobody free →
  Population opens).
- `src/data/foodOutlook.js`, HUD `#food-countdown` "Food for X days" with tone and tooltip; `KingdomAttractivenessSystem.
  blockReason` (food < 2 days or > 3 unemployed) stops newcomers, shown in the Kingdom overview.
- `NightThreatSystem.started()` (5 finished Houses or year 2; day 20 without seasons) gates wolves, thieves and fires;
  the first spark only warns (`fireWarned`, optional save field).
- Texts: `#camera-mode` i18n, `status.buildCancelled`, Brazier description.

## Implementation decisions
- The stall from the report (sites waiting 8 days) could not be reproduced on a new world; instead of guessing a cause,
  a waiting site is now visible (notice) and self-healing (Builders carry). Construction deliveries already had the top
  priority in `LogisticsTaskManager`.
- The free Lumberjack Hut books an empty price (`investedMaterials {}`), so saves keep it free.
- Night-threat start is "whichever comes first" until the owner answers the open question in the report.

## Save/Load impact
SAVE_VERSION stays 57. New optional field `nightThreats.fireWarned`; older saves load (threats then wait for the start
condition like a new game).

## Testing
- New: `tests/basic-wood-buildings.test.js` (wood prices, start, free hut, food outlook), waiting-material and hiring in
  `tests/production-diagnostics.test.js`, threat start in `tests/night-threats.test.js`; many fixtures updated to the new
  prices.
- Browser smoke `--e1`: food days, wooden Granary, Add a Builder, no Czech text in the English UI.

## Notes for the next agent
- The Studio price proposals that were applied must be deleted from the Studio database (`prices/*`).
- Tutorial texts (Getting started) still list the old order; E3 replaces them.
