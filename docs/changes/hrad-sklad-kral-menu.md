# Castle upgrade by Builders, start layout, build menu order (0.139.0)

## What and why
Owner 15 Nov 2026, points 60–63: the Starter Stockpile at least 2 tiles from the Castle (room for a bigger Castle); the Castle upgrade done by a Builder over time; the King starts in front of the Castle; a new order of the build menu, with the Castle not locked but opening its upgrade.

## Files and systems
- 60/62 `src/systems/WorldGenerationConfig.js`: `STARTER_STOCKPILE_GAP`, `tileGap`, `kingStartTile`, `placeKingInFront` (called in GameScene after the whole generation, before the world fingerprint).
- 61 `src/data/castle.js` (`work` per level), `src/game/castleUpgrade.js` (`castleUpgradePlan({paid})`, `upgradeCastle` orders, `applyCastleLevel`), `src/systems/RepairSystem.js` (`requestUpgrade`, `finishUpgrade`, `building.upgrade` job with kind 'upgrade'), `BuilderAI` message, serializer validation of `building.upgrade` and its 'repair' tasks, **SAVE_VERSION 63**; i18n `castle.upgrading/repairing/upgradeOrdered/menuUpgrade`.
- 63 `src/data/buildingCategories.js` (`BUILDING_MENU_ORDER`), `src/ui/BuildingBar.js` (the standing Castle not locked), `GameScene.startBuilding` (Castle opens its window).

## Implementation decisions
- The upgrade reuses the repair machinery (Builders' 'repair' task, shared work); a repair and an upgrade never run together. Materials are paid when ordered, like a repair; nothing is refunded if the Castle is demolished or burns.
- The new footprint is checked again when the work is done; while a unit or the King blocks it the level waits.
- The King is moved after all trees and deposits are placed, so his tile is free; the world fingerprint does not include him.

## Save/Load impact
SAVE_VERSION 62 → 63 (optional `building.upgrade` on the Castle). The test save fixture was moved to 63 (it has no upgrade).

## Testing
New tests: start-layout (tileGap, King tile), building-repair (upgrade by Builders, save/validation), building-categories (new order). Browser: King in front of the Castle, stockpile 2 tiles away, the Castle card opens the Castle window with the Upgrade.

## Notes for the next agent
Owner point 59 (relocate a building) is the next step.
