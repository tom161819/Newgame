# Battle panel only for a real fight (0.144.2)

## What and why
Owner 17 Nov 2026: the panel "Battle · ours 1/2 · enemies 5/5" stayed on screen with no enemy anywhere in sight, apparently stuck at the castle construction. The panel took every pair in `combat.attacks`.
- A pair stays there while an attacker chases a target it cannot reach. For example, a ranged soldier keeps its target even out of range.
- An enemy in the fog counted too.
So the panel could stay up indefinitely.

## Files and systems
`ui/CombatFeedback.trackBattle`: a pair counts only when:
- both units are alive;
- they are within reach of each other (`inAttackRange`);
- the enemy is in sight (fog).

The quiet time (5 s) then ends the battle as before.

## Implementation decisions
Only the summary changed; who fights whom is untouched. "ours 1/2" means two of ours took part and one still stands; "enemies 5/5" means five enemies took part and all five still stand.

## Save/Load impact
None.

## Testing
tests/battle-panel.test.js: a far chase starts no battle; an enemy within reach does; an enemy out of sight does not; the battle ends once nobody is within reach. npm test.

## Notes for the next agent
Which five enemies the owner had is unknown (likely wolves at night). The owner's bug data, asked for with the save problem, may show it.
