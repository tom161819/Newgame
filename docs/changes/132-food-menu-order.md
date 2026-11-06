# #132 – Food menu order and the Hunting Lodge unlock

## What and why
The owner asked for the Granary to be first among the food buildings and the Farmhouse second, and for the Hunting Lodge to unlock only after a Granary. Until now the Food & Farming menu followed registration order (Hunting Lodge, Farmhouse, Wheat Field, Orchard, Mill, Bakery, Granary), and the lodge had no requirement. The notices "Mill without a Wheat Field" and "Bakery without a Mill" already existed (0.4.0) and are unchanged. The task is tracked on the plan page as `m-132-poradi-potravinovych-budov`.

## Files and systems
- `src/data/buildingCategories.js`: `buildingsInCategory` sorts by the optional `menuOrder` inside each category. In All, each category keeps its slots, so only food buildings change places.
- `src/systems/ObjectRegistry.js`: `menuOrder` must be a finite number on a building.
- `src/data/objects/{foodProduction,farming,buildings}.js`: `menuOrder` gives Granary 10, Farmhouse 20, Wheat Field 30, Orchard 40, Hunting Lodge 50, Mill 60 and Bakery 70. The Hunting Lodge gets `requiresCompletedBuildings: ['granary']` and an `unlockDescription`.
- Tests: `building-categories`, `building-unlocks` (a new #132 test: a blueprint Granary does not unlock the lodge, a completed one does), `workplaces` (lodges in tests now get their Granary through `ensureBuildingPrerequisites`; the save test runs with food storage, because a completed Granary needs it). `scripts/building-menu-smoke.mjs` expects the new order, a locked lodge in a new game, and the lodge unlocked after the Granary.

## Implementation decisions
- I used `menuOrder` rather than reordering the registry, because registry order is used elsewhere (All, Asset Library, tests) and would have shuffled other categories.
- The requirement reuses the existing unlock mechanism of Farmhouse, fields and orchards. It is checked only when placing. Existing lodges and placed blueprints, including provisional ones outside sight (`ConstructionSystem` verifies with `unlocked: true`), are not affected.

## Save/Load impact
None. SAVE_VERSION stays 36; definitions are not saved.

## Testing
`npm test` passes (781). The browser smoke passes with `--current-only` and with the new `--building-unlocks` flag, which runs `buildingUnlockGameplaySmoke` alone: Granary, then Farmhouse and Hunting Lodge unlocked. `--horse-wagon` passes alone. The full `--full` run timed out once in the horse wagon step while another Chrome was running beside it; that step is unrelated to this change. The page build (`npm run build:artifact`) was opened from a nested path: the Food menu reads granary, farmhouse, wheat_field, orchard, hunting_lodge, mill, bakery, and the lodge shows "Build a Granary".

## Notes for the next agent
A starting castle does not unlock the lodge. Hunting now starts after the first Granary, which costs 10 Stone, like the Farmhouse chain.
