# Start 2: 200 Bread, room for 10 at the Castle, a starting garrison (m-start-v2)

## What and why
Owner requests 7 Nov 2026 (points 37, 40, 44).

## Files and systems
- Bread (37): `NEW_GAME_DEFAULTS.startingBread` 200. To fit, the Starter Stockpile holds 300 (`LOGISTICS_RULES.
  starterCapacity`, was 160); the setup sliders go to 300 and the defaults (40 Stone, 60 Wood, 200 Bread) fill it.
  Quick starts: Calm 50 Stone, 70 Wood, 180 Bread; Challenge 20 Stone, 40 Wood, 120 Bread.
- Capacity (40): `POPULATION.maximum` 10 (was 20): the Castle settlement holds 10, each finished House adds its
  capacity. The HUD shows "Residents 7 / 10". When the settlement is full on a new day, the event feed says once per
  capacity "No room for new villagers – build Houses" (`feed.populationFull`). Migrants already stop at the capacity.
- Garrison (44): `START_GARRISON` (2 Soldiers, 2 Archers) in `src/data/military.js`; `MilitarySystem.
  enlistStartingGarrison` spawns them near the start in a new game (`WorkerSystem.spawnNearStart`) and enlists them
  with their unit's own equipment (no Armory stock). They count into the population (3 + 4 = 7 ≤ 10). Garrison units
  (`garrison:true`, saved) need no Barracks; other units are still released without one.

## Implementation decisions
- Raising the Starter Stockpile was simpler than a starting Granary (which would change the tutorial's first step).

## Save/Load impact
Military units may carry `garrison:true` (validated). SAVE_VERSION stays 58 (bumped in 0.52.0).

## Testing
`tests/start-v2.test.js`; starting-resources, logistics and granary tests derive from the constants; browser smoke
`--start-v2`, main smoke setup totals 300 / 300.

## Notes for the next agent
- Garrison soldiers stand near the Castle; smokes that pick a building spot next to the Castle should avoid resident
  tiles (see `scripts/e1-smoke.mjs`).
