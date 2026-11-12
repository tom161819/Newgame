# Saving works again (m-ukladani-chyba)

## What and why
Owner, 12 Nov 2026 (16): manual save, autosave and continuing after a new version all failed. A browser script
(`/tmp/perfdiag/save-stress*.mjs`, not in the repo) played a 30-resident village at full speed for up to 90 game days
and tried to save every 5 game seconds; every refused save was written to a file and checked in Node to the exact line.

## Files and systems
See the two lists below: every cause names its file, every other change names its module.

## Causes found and fixed
1. A batch running in a workshop when a recipe changed (Pitch Kiln 0.99.0; Mill and Bakery 0.91.0) made the save
   unloadable. `RECIPE_HISTORY` / `recipeVariants` (`src/data/production.js`) keep the earlier recipes; the save check
   accepts a running or waiting batch that matches any of them, and it finishes as it started. `LEGACY_RECIPE_OUTPUTS`
   is gone (covered by the history).
2. A Hunter who killed a wolf kept an `animalKilled` reward for a wolf; the check allowed only rabbit, deer and boar.
3. A building that burnt down at night kept its workplace record (and its workers' links, production reservations,
   orders). `detachLostBuilding` (`src/game/buildingRemoval.js`) does the same cleanup as a demolition without refund;
   `NightThreatSystem.burnDown` uses it. A burnt Fisherman's Hut's catch count and a burnt house hidden by the
   children are dropped on export and on load.
4. A resident who died while resting kept `restPhase`; a soldier who left the army kept his squad number; a miner who
   lost his loan state conditions kept `clearingLoan`. The serializer now writes these only when they are valid.
5. Trade price history older than 20 days stayed in the save when no caravan came for a while; it is now pruned on
   export and on load.

## Other changes
- m-sklady-co-patri: `StoragePanel.accepts` / `storeAccepts` (+ `PRODUCERS` map), texts `storage.accepts`, `storage.noMaker`, `storage.elsewhere.*`.
- m-kasarna-limit-zamestnani: `BARRACKS_AUTO_HIRE_DEFAULT` 4 and `barracksAutoHire` (`src/data/military.js`), used by `EmploymentSystem.seats`; optional `buildings[].autoHire` (Barracks only, 0–capacity); slider `#barracks-auto-hire` in `militaryPanel.js` kept across re-renders.
- m-hornici-oznacene-skaly: `RockMiningWork.lendable/openRocks/borrow` lend Miners to any marked rock (not only wall plans), nearest first, as many as open rocks minus free Miners, one stays per workplace (also in the save check, `RockMiningState`). Message `rock.lent`.
- m-pracovnici-odnaseji-vyrobky: `FoodProductionSystem.carryOwnOutput` (pile full → one worker carries a load to a store; not when a Hauler has the stock reserved, one worker per building), called from `MiningWork` and `ForestryWork`. Workshops already carried their own output after 3 s without a Hauler.
- m-smolar-nosi-vyrobky: `selfSupplied:true` on the Pitch Kiln; `LogisticsTaskManager` offers no input/output jobs for such buildings and `waitForHauler` returns false.
- m-budovy-klik-mimo-dohled: `GameScene.buildingReachable` (in sight, unverified, or any footprint tile explored) for click and hover of buildings.
- Rats no longer eat a finished batch waiting in a workshop output (it is promised to a store); such saves are repaired on load.
- The save check names the part that failed (`[workers]`, `[trade]`, …) in its message (`error.savePart`).
- Saving retries up to 3 times after one 50 ms simulation step before it reports the failure with the part.
- Dev tool: quick action "Download the failed save" (`src/systems/saveFailure.js`) – the last failed save or load as
  JSON for a bug report (kept in memory only).
- Marketplace no longer needs a Warehouse (m-trziste-bez-skladu).
- Keys + and − step the game speed: pause ↔ 1× ↔ 2× ↔ 3× (m-klavesy-rychlost).

## Implementation decisions
- Stale or dangling optional fields are dropped where they are written (serializer, `exportState`) and, for saves that
  already hold them, cleaned in the copy the save check works on – never a SAVE_VERSION bump.
- A running batch keeps the recipe it started with through `RECIPE_HISTORY` instead of loosening the check, so a
  forged batch is still refused.
- A failed save retries after short simulation steps: a state caught mid-step passes on the next try.

## Save/Load impact
SAVE_VERSION stays 62. Saves of 0.91–0.100 load again, including those with a running Pitch Kiln, Mill or Bakery
batch and those with stale trade history, a burnt hut's catch count or a burnt house in the children's state.

## Testing
- `npm test` (new: recipe history, burnt workplace, squad/restPhase, speed keys, earlier-release save fixture).
- Browser smoke `--save-compat` (new): the 0.91 village fixture loads, plays 60 s, saves through the check into
  IndexedDB and loads back. `--autosave` passes.
- Stress: 90 game days, about 2000 saves, no refused save after the fixes.

## Notes for the next agent
- When a recipe's input, output or duration changes, add the old recipe to `RECIPE_HISTORY` (or bump SAVE_VERSION).
- Add a saved village from each release to `tests/fixtures/saves/` (gzip). Every release must load them.
- A system that removes a building outside demolition must call `detachLostBuilding`.
