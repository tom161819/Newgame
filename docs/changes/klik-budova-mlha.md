# Own buildings and blueprints open in fog (owner point 80)

## What and why
Owner, 19 Nov 2026: allow clicking a building (also a blueprint) even when it is in fog.
Before, a click on explored ground worked only for some windows: the construction window, the field window, the building detail and the Notices "go to" closed at once or refused when the building was out of sight.

## Files and systems
- New `src/game/fogReach.js` — `buildingReachable(fog,building)`: own buildings and blueprints always; enemy buildings (`building.enemy`) only in sight or on explored ground.
- `src/game/GameScene.js` — `buildingReachable` delegates to it (used by click, hover tooltip and `towerAtPoint`).
- `src/ui/ConstructionUI.js`, `FarmingPanel.js`, `WorkplacePanel.js`, `NoticesPanel.js`, `DemolitionUI.js` — keep their window open with the same rule.

## Implementation decisions
- Demolition (and removing the Starter Stockpile) still needs sight: the window opens, the dismantle button says it is unavailable. Only the click was asked for.
- Own buildings in black fog are reachable too, since the King always knows what he built.

## Save/Load impact
None.

## Testing
New `tests/fog-reach.test.js`. Browser check: a Lumberjack's Hut hidden by fog opens its workplace window and it stays open.

## Notes for the next agent
If the owner wants demolition from fog too, change `DemolitionUI.status`, `DemolitionSystem.order` and `FoodStorageSystem.starterRemovalStatus` together (and `tests/stockpile-cleanup.test.js`).
