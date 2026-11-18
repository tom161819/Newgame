# Long-range units shoot 50 % further

## What and why
Owner 18 Nov 2026: "ať mají všechny long range jednotky o 50% větší dostřel (i katapult)".

| Unit | Before | Now |
| --- | --- | --- |
| Archer | 6 | 9 |
| Royal Archer | 6 | 9 |
| Crossbowman | 5 | 7.5 |
| Enemy Archer | 6 | 9 |
| Catapult | 12 (min 3) | 18 (min 3) |
| Lobbed shot over a wall | 4 | 6 |

## Files and systems
- `src/data/military.js`: `attackRange` modifiers of the Archer (5 → 8), Royal Archer (5 → 8), Crossbowman (4 → 6.5) on top of the base 1; `CATAPULT.range` 18.
- `src/data/militaryEquipment.js`: the `range` shown for Bow (9) and Crossbow (7.5).
- `src/data/objects/animals.js`: Enemy Archer `attackRange` 9.
- `src/systems/CombatSystem.js`: `LOB.range` 6.
- i18n (en, cs): Wiki texts of the Bow, Archer, Crossbowman and Catapult.
- Tests updated to the new numbers: `military-units`, `new-units`, `wall-access` (the wall archer now shoots a raider 10 tiles away), `battle-fixes` (lob limits).

## Implementation decisions
- "All long-range units" is read as both sides (the enemy archers too) so the balance between archers stays as it was. Hunters and the King are not units and keep their ranges.
- The wall bonus (+2 tiles from a wall, Tower or Gate) stays on top. The Catapult's minimum range stays 3.
- The lobbed shot is a range too, so it grew by half as well.

## Save/Load impact
None. Unit stats are recalculated from the data on load. SAVE_VERSION stays 65.

## Testing
- Full suite.

## Notes for the next agent
- Our archers find targets by their range (`nearestEnemy(worker,attackRange)`), but shooting needs the target visible in the fog of war; where sight is shorter than 9 tiles the longer range only counts on visible ground.
