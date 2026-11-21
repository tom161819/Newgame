# Saves with points from the retired royal tasks load again

## What and why
Owner, 21 Nov 2026: "proč mi nejde načíst hra?". The Load panel showed "Uložená hra je poškozená nebo má nepodporovanou verzi. [kingSkills]".

Release 0.149.24 retired the Wall and Barracks royal tasks. Before that, finishing them gave the King 2 + 3 skill points.

- A save from before 0.149.24 still lists them as done, so it loads.
- On import the retired ids are skipped. The next save no longer lists them, but it keeps the King's points.
- The King skill check limits points (spent and unspent) to what the listed done tasks earned. So that later save was refused.

## Files and systems
- `src/data/royalGoals.js`: `RETIRED_ROYAL_GOAL_POINTS = 5`.
- `src/systems/KingSkills.js`: `validKingSkillState` allows these points on top of what the listed tasks earned.
- `tests/king-xp.test.js`: a save with 5 points and no done tasks loads; 6 points are still refused.

## Implementation decisions
- The allowance applies to every save. Saves do not record which retired tasks were finished. At most 5 extra points are tolerated.

## Save/Load impact
SAVE_VERSION is unchanged. Saves refused since 0.149.24 for this reason load again.

## Testing
- `npm test`.

## Notes for the next agent
When a royal task that gives skill points is retired, add its points to `RETIRED_ROYAL_GOAL_POINTS`.
