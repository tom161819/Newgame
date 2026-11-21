# Kingdom rank: owner's answers

## What and why
Owner 21 Nov 2026 to the questions after 0.149.23: (1) the unlock levels given to buildings missing in his table are
right; (2) the Castle does not count among the 8 buildings for Village; (3) the Royal tasks Wall and Barracks are
dropped (they need Castle level 3).

## Files and systems
- `src/data/kingdomRank.js`: `castle` added to `RANK_UNCOUNTED`; the "provisional" note is now "confirmed".
- `src/data/royalGoals.js`: the `wall` and `barracks` goals removed; `RETIRED_ROYAL_GOALS` lists them.
- `src/systems/RoyalGoals.js`: `validRoyalGoalState` accepts the retired ids, so a save that finished them still
  loads (import already skips unknown ids).
- `tests/kingdom-rank.test.js`: the count without the Castle.

## Implementation decisions
- Retired ids are accepted instead of raising SAVE_VERSION: the saved data shape is unchanged.

## Save/Load impact
None. Saves with the finished Wall or Barracks task load; those entries are dropped.

## Testing
- `npm test`.

## Notes for the next agent
- New Royal tasks for later ranks can be added when the owner defines the rank conditions.
