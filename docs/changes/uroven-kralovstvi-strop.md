# Population cap after the upgrade

## What and why
Owner 21 Nov 2026: the "population cap" of his table is the cap after the upgrade. So Castle level 2: 50 residents,
level 3: 100, level 4: no cap. Level 1 has no number in the table; it gets 20, the residents the upgrade to level 2
needs (to be confirmed by the owner).

## Files and systems
- `src/data/kingdomRank.js`: `RANK_POPULATION_CAP` {1: 20, 2: 50, 3: 100, 4: none}.
- `tests/kingdom-rank.test.js`.

## Implementation decisions
- Residents above a cap stay; only arrivals stop.

## Save/Load impact
None.

## Testing
- `npm test`.

## Notes for the next agent
- Level 1's cap of 20 is a guess; change `RANK_POPULATION_CAP[1]` if the owner gives another number.
