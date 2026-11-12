# Approved tasks of 12 Nov 2026 (evening)

## What and why
The owner approved `m-pravy-klik-zavre-panel`, `m-nosic-priorita` and `m-smolarna-rychlost` and answered that the
Woodcutter's "no range" applies to Hunters and Fishers too. The two open questions in the specs had no answer, so the
proposals stand: the Pitch Kiln makes four times as much in the same time; a right click with soldiers chosen in the
Army panel sends them and leaves the panel open.

## Files and systems
- **Pitch Kiln** – `src/data/production.js` (`PITCH_RECIPES`). The input buffer (30) holds the larger batch.
- **Hunter range** – `src/systems/WorkerAI.js`: `huntable` (inside the old radius always, beyond on explored ground),
  `nearest` (12 nearest to the lodge are routed to). Fishers: nothing to do (`FishingSystem` has no radius since 7 Nov).
- **Right click / Escape** – `src/game/GameScene.js` (`sidePanels`), `BuildingBar.dismissable`,
  `ArmyPanel.dismissable` / `clearPick`, `src/ui/GameApplication.js` (Escape).
- **Hauler priority** – `src/data/logistics.js` (`HAUL_PRIORITIES`, `matchesHaulPriority`, `validHaulPriority`),
  `src/systems/haulPriority.js`, `src/systems/LogisticsTaskManager.js` (sort: urgent food, the choice, the shared order;
  pile tasks carry `pile:true`), `src/ui/UnitPanel.js`, `src/ui/UnitSelection.js`, `src/ui/PopulationSidebar.js`,
  `src/systems/ProductionDiagnostics.js` (`pileWaiting`), save in `GameStateSerializer` / `GameStateLoader`, texts,
  styles (the Hauler's controls one per line).

## Implementation decisions
- **SAVE_VERSION stays 62** although the spec said +1: the alpha policy loads only the current schema, so a bump would
  make every existing save unloadable. `haulPriority` is an optional worker field; 'Anything' is not saved.
- No icon over a Hauler on the map (spec point 3): the choice shows in his window and in the Population list.
- 'Building materials' = Stone, Wood, Iron, Iron Ore and every delivery to a construction site; 'Workshop products' =
  output stores and producer piles.

## Save/Load impact
Optional field `workers[].haulPriority` ({kind} or {kind:'resource', resource}). Older saves load unchanged.

## Testing
- `npm test`: 1264 pass (new: Hauler choice end to end with save/load, the waiting notice, Hunter range; Pitch Kiln
  numbers).
- Browser: `--torches`, `--woodcutter-trees`, `--recruits`, `--hud-cargo` pass. Checked by script in headless Chrome:
  right click closes Buildings and Army, with a chosen soldier it sends him and the panel stays, Escape closes both,
  the Hauler's select sets the choice. `--unit-commands` fails, and failed on untouched 0.98.0 too; drag selection
  was checked by hand.

## Notes for the next agent
- `--unit-commands` needs repair (it fails on 0.98.0 already).
- No browser smoke for the Hauler choice or the right-click closing yet.
