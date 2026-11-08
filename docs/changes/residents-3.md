# m-obyvatele-jmena-spanek-pohyb – resident names, sleeping inside, 25 % slower walking

## What and why
Owner requests 31, 42 and 43. Residents were called "Pavel", "Pavel 2"…; now every resident has a first name, a surname and an origin ("Jaroslav Flaška z Pičína", "John Thatcher of Little Snoring") in the game language, never repeated in one game. At rest time residents with a House go inside and disappear, those with only a base place sleep in the Castle, and they come out at the door in the morning. Every walker moves at 0.75 of its listed speed, with walk animations slowed the same way.

## Files and systems
- `src/data/names.js` (generator, Czech female surnames, short/full name), `src/data/names.cs.js` / `names.en.js` (40+40 first names, 130 surnames, 100 origins, children's names; the two languages are index-aligned).
- `WorkerController` gets `identity`, a `name` getter (short form) and a `fullName` getter; `WorkerSystem.create` picks the identity with a seed from the world code and the id, skipping names already used (living, dead, deceased records). Thieves keep their plain name.
- UI: panels and rows use `name`; the resident detail (`#unit-name`) and the population tooltip show `fullName`. Children (`ChildrenSystem.family/nameOf`) take the surname and origin of the house's first resident; `CHILDREN.names` moved to the name files.
- Sleeping: `DailyRest.shelter()` and `worker.sleepingIn` (House or Castle id). A sleeper reserves no tile, is hidden (GameScene visibility loop), cannot be picked or selected, is not wolf prey, and `WorldCamera.locate` focuses his building. `WorkerSystem.sleepersIn(id)`; the House panel (`VillagePanel`) shows "Inside now". When a house catches fire its sleepers are woken, and `shelter()` refuses a burning building.
- Speed: `src/data/movement.js` `MOVEMENT_SPEED_SCALE = 0.75`, applied in `advanceMovement` (King, residents, soldiers, animals, caravans; vehicles follow their drivers), in the children's walk/play, the pets' `step`, the rats, and the walk animations (HumanView/KingView/AnimalView phases, walk-sheet time in HumanView and `applyAnimalArt`, child/pet stride).
- `WorkerController.canEnterTile`: when a resident is blocked he now waits a random 100–500 ms (before: at most 100 ms). With the slower walk, two Haulers in `tests/logistics-integration` kept copying each other's detours forever (a livelock); the random wait breaks it.

## Implementation decisions
- Names are saved as language-neutral list indices `{sex,first,surname,origin}`, not as text, so a language switch renames everybody sensibly. Uniqueness is kept on sex+first+surname, so the short form is unique in both languages (tests check that female forms stay unique).
- Czech female forms follow rules (-ý→-á, -í stays, -ec→-cová, -ek→-ková, vowel→-ová, consonant→+ová), with overrides for irregular names (Šnek, Kozel, Datel).
- Families are derived, not saved: a child's surname comes from the house's lowest-id resident. Within one surname no two children share a first name.
- `sleepingIn` is derived every frame from `restPhase === 'resting'`, standing at a door of the shelter and not moving, so it is not saved; after a load the first update puts the sleeper inside again.
- Soldiers on the night watch rest by day (unchanged), so at night they stay outside. The Castle's own click panel (Employment) does not list its sleepers; only the House panel does.

## Save/Load impact
SAVE_VERSION stays 58. New optional and strictly validated fields: `workers[].identity` (exact keys, indices in range, no two workers with the same identity) and `population.deceased[].identity`. The text `name` is still saved; saves without `identity` load with their stored plain name.

## Testing
`tests/residents-3.test.js` (8 tests: lists, female forms, uniqueness/language/seed, Save/Load and corrupt identities, children, sleeping in a House, the Castle, fire, soldier, Locate, speed). Timing tests that broke were given more simulated time or divided by the scale (path-wear, player, hunting, visibility-mount, wildlife-clearance, workers, fishing, logistics-*); daily-rest now expects "Sleeping at home". `npm test`: 1040/1040 pass.
Smokes: new `--residents-3` passes. The full run (`--current-only --keep-going --full`, interrupted by a server restart and finished in batches by flag) passes, except tutorial, employment-spread, thieves, overview, zoom, minerals and e1. All seven fail the same way on the unchanged code (checked with `git stash`), so they are pre-existing failures (no building site on that world, etc.). population-smoke and unit-command-smoke now compute the expected names.
Economy (`node scripts/residents-3-economy.mjs`, seeded scene: Lumberjack Hut with 3 Woodcutters, Hunting Lodge with 2 Hunters, 120 s days):
- Default scene (40 trees, 20 rabbits): wood on day 1 was 90 before and 90 after. Meat on day 1 was 85 before and 70 after (−18 %). 120 wood was reached on day 1.383 before and 1.425 after (+3 %). 50 meat was reached on day 0.392 before and 0.575 after (+47 % time). Totals over 3 days are the same (the resources run out).
- Big scene (`TREES=100 RABBITS=40`): wood on day 1 was 102 before and 90 after (−12 %). Meat on day 1 was 95 before and 65 after (−32 %). 120 wood was reached on day 1.142 before and 1.308 after (+15 %). 50 meat was reached on day 0.45 before and 0.675 after (+50 %). On day 2 the 300 starter storage limit caps both runs.
Walking-heavy jobs (hunting, hauling) lose the most; chopping time dominates wood.

## Notes for the next agent
- Any new walker must use `advanceMovement` or multiply by `MOVEMENT_SPEED_SCALE`; exact-timing tests should divide by it.
- The Castle panel could list its sleepers (`workerSystem.sleepersIn(castle.id)`).
- Deceased lines saved before this change keep their old plain names.
- The pre-existing smoke failures (tutorial/e1 "room for granary", employment-spread, thieves, overview, zoom, minerals) deserve their own task.
