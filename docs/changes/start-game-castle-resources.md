# Start of a game: Castle, Gold and starting resources (owner task, 7 Nov 2026)

## What and why
The owner asked for a friendlier start: the New Game setup should propose a Castle, Gold and some resources, the starting stockpile should hold more, Gold should have a ceiling and only one Castle may exist. Tracked on the plan page as `m-start-hry-hrad-suroviny`.

## Files and systems
- `src/systems/GameSettings.js`: `NEW_GAME_DEFAULTS` (Castle on, 500 Gold, 40 Stone/Wood/Iron Ore/Bread) used only by the setup dialog. `DEFAULT_GAME_SETTINGS` stays empty so tests and code that start a game without the dialog are unchanged.
- `src/ui/NewGameSetup.js`, `index.html`: setup reset uses `NEW_GAME_DEFAULTS`; resource sliders go to 160.
- `src/data/logistics.js`, `src/data/objects/logistics.js`: starter stockpile capacity 160 (`starterCapacity`), `legacyStarterCapacity: 40`.
- `src/systems/FoodStateValidation.js`: a saved starter location with capacity 40 is still valid (older saves).
- `src/data/economy.js`, `src/game/inventory.js`: `GOLD_LIMIT = 500`; `add()` caps Gold, amounts already above the limit are kept, the ledger records only what was really added; `limit(resource)`.
- `src/ui/InventoryBar.js`: Gold shown as `x / 500`; new Stores item (used / capacity of the stockpile and warehouses), i18n `hud.storeCapacity`, `hud.storeCapacityHint`.
- `src/data/objects/buildings.js`, `BuildingUnlockManager`, `buildingUnlockStatus`, `ObjectRegistry`: Castle `maxCount: 1`; a built Castle locks the button with `unlock.alreadyBuilt`.
- Tests: new `tests/start-game.test.js`; capacity numbers updated in starting-resources, logistics-storage, granary-capacity, forestry-workers, logistics-construction, minerals, castle-gathering. `scripts/browser-smoke.mjs` checks the setup defaults and then sets the old empty start for its scenario.

## Implementation decisions
- Defaults only in the dialog, not in `DEFAULT_GAME_SETTINGS`, to keep every existing scenario stable.
- Gold cap is soft for existing amounts (never removes Gold), hard for new income.
- `maxCount` is a generic building field, so other unique buildings can use it later.

## Save/Load impact
No new save format. Older saves keep starter capacity 40 and load as before; new games save capacity 160.

## Testing
`npm test` passes (792). `npm run smoke -- --current-only`, `--building-unlocks` and `--castle-gathering` pass.

## Notes for the next agent
- Change the proposed start in `NEW_GAME_DEFAULTS` and the matching `value` attributes in `index.html` together.
- A second unique building: set `maxCount: 1` and add a case to `tests/start-game.test.js`.
- Run `npm run version:check -- --base=HEAD^1` (origin/main in the backup is stale).
