# Kingdom rank: residents needed and the population cap

## What and why
Owner 21 Nov 2026 (table): the Castle upgrade needs residents – level 1 → 2: 20, 2 → 3: 50, 3 → 4: 80 – and the
population is capped by the Castle level: 50 at level 1, 100 at level 2, no cap from level 3.

## Files and systems
- `src/data/kingdomRank.js`: a `population` condition in `RANK_REQUIREMENTS` for levels 2, 3 and 4;
  `RANK_POPULATION_CAP` / `rankPopulationCap`.
- `src/game/kingdomRankState.js`: `population` = living residents.
- `src/systems/WorkerSystem.js`: `capacity()` = the housing room (`housingCapacity()`, the old formula) capped by
  the rank cap when the scene has `kingdomRanks` and is not the sandbox. Arrivals and the HUD "9 / 10" use it.
- `src/ui/KingdomRankDisplay.js`: the hover panel names the cap. en/cs texts.
- `tests/kingdom-rank.test.js`.

## Implementation decisions
- The "population cap" column is read as the cap while the Castle has that row's starting level (level 1: 50,
  level 2: 100, level 3 and 4: none).
- Residents already above the cap stay; only new arrivals stop.

## Save/Load impact
None.

## Testing
- `npm test`.

## Notes for the next agent
- If the owner meant the cap after the upgrade, shift `RANK_POPULATION_CAP` by one level.
