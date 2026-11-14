# Castle levels and upgrade

## What and why
Owner, 14–15 Nov 2026: four Castle levels (renders), level 1 built at the start or for 40 Wood, upgrades for 70 Wood, 50 Stone, 100 Stone from the Castle's card; footprints 4 × 4, 4 × 4, 5 × 5, 6 × 6; a message when the bigger footprint has no room. Sight automatically from level 2; old saves keep their Castle and can upgrade; levels give hit points, room for residents, Safety and income. Later the upgrades will be tied to the kingdom's rank (Settlement → Village → Small town → Town); now there are no conditions.

## Files and systems
- `src/data/castle.js` (new): `CASTLE_LEVELS`, `castleLevel`, `castleRules`, `CASTLE_ART`.
- `src/game/buildings.js`: `levelDefinition(d,level)`; `definitionFor` and `placeBuilding` know `building.level`.
- `src/game/castleUpgrade.js` (new): `castleUpgradePlan`, `upgradeCastle`.
- `src/systems/AssetManager.js` `createView`: a building with a level is drawn from its level definition (plain sprite view, look `l<level>`); `src/systems/SpriteViews.js`: `noFront`.
- `src/game/GameScene.js`: a Castle picked in the menu is level 1; sight source `castles`. `src/systems/WorldGenerationConfig.js`: the starting Castle is level 1.
- `src/ui/EmploymentPanel.js`, `index.html` (`#castle-upgrade`), `src/ui/BuildingBar.js` (`menuCost`).
- Benefits: `src/game/buildingHealth.js`, `src/systems/NeedsSystem.js` (Safety), `src/systems/WorkerSystem.js` (capacity), income through the level definition's `production`.
- Save: optional `level` (`GameStateSerializer`), remembered footprint (`MapMemoryValidation`).
- Art: `public/assets/buildings/castle/castle-l?-0.v2.png`, `art/approvals.json`.

## Implementation decisions
- One building type. The registry definition stays the old stone keep (3 × 3, climbable, 20 Stone in tests), so older saves and the code that asks for `castle` are untouched; a Castle with `level` uses the level definition.
- The upgrade is paid from the stores and stands at once (no construction time). The Castle grows on the spot; the anchor may shift so it grows to any side, the most centred fit first.
- Level definitions have no `enter` interaction, platform or lights yet (the torches in the pictures do not shine).
- The numbers of the benefits are a first guess.

## Save/Load impact
Optional `level` (1–4) on a Castle; SAVE_VERSION stays 62. Older saves load unchanged.

## Testing
- `tests/save-animal-retaliation.test.js` (levels and upgrade), adjusted: world-configuration, logistics-storage, hauler-idle-stone, zelezny-dul-misto, assets; full suite.
- Browser (headless Chrome): level 1 placed, upgrades to 2, 3 and 4 through the card's button, pictures and footprints checked; a legacy Castle in a dense village shows the "clear the ground" message.
- Not checked in a browser: a new game's starting Castle, building a Castle from the menu by Builders, night look.

## Notes for the next agent
- The menu icon of the Castle is still the old keep.
- Kingdom ranks as upgrade conditions are not started.
